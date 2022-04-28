'use strict';

import { getInput, info } from '@actions/core';
import github from '@actions/github';

export async function run() {
    const token = getInput('token');
    const context = github.context;
    const payload = context.payload;

    if (!payload.pull_request) {
        return;
    }

    const prNumber = payload.pull_request.number;
    const pullRequestBody = payload.pull_request.body || '';

    const matchStr = pullRequestBody.match(/<!-- Record Reviewer -->((.|\r|\n|\r\n)*)<!-- End Reviewer -->/);
    if (!matchStr || !matchStr[1]) {
        info('No Reviewer found');
        return;
    }

    const results = matchStr[1].replace(/(\r\n|\r|\n)/g, ' ').split(' ').filter(str => !!str);
    const reviewers: string[] = [];
    results.forEach((str) => {
        str = str.trim();
        if (str.startsWith('@')) {
            reviewers.push(str.substr(1));
        }
    });

    const client = github.getOctokit(token);

    const params = {
        ...context.repo,
        pull_number: prNumber,
        reviewers: reviewers,
    };
    await client.pulls.requestReviewers(params);
}

run();