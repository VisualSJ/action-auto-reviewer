'use strict';

import { getInput, info } from '@actions/core';
import { context, getOctokit } from '@actions/github';

export async function run() {
    const token = getInput('token');
    const payload = context.payload;

    if (!payload.pull_request) {
        return;
    }

    const prNumber = payload.pull_request.number;
    const pullRequestBody = payload.pull_request.body || '';
    const user = payload.pull_request.user.login;
    const debug = (getInput('debug') === 'true');

    const event = context.eventName;
    if (event != 'pull_request') {
        info(`Event: ${event}`);
        return;
    }

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

    if (debug) {
        info(`Input reviewers: ${reviewers}`);
    }

    const client = getOctokit(token);

    const reviewsParam = {
        ...context.repo,
        pull_number: prNumber,
    };
    const reviewsResponse = await client.pulls.listReviews(reviewsParam);

    const reviews = new Map();
    reviewsResponse.data.forEach(review => {
        if (review.user) {
            reviews.set(review.user.login, review.state);
        }
    });

    const userRemovedReviewers = reviewers.filter(reviewer => reviewer != user);
    const finalReviewers = [];
    userRemovedReviewers.forEach(reviewer => {
        const rev = reviews.get(reviewer);
        if (rev == null) {
            finalReviewers.push(reviewer);
        } else {
            if (rev == 'CHANGES_REQUESTED') {
                info(`Changes Requested: Not requesting re-review from ${reviewer}`);
            } else if (rev == 'APPROVED') {
                info(`Approved: Not requesting re-review from ${reviewer}`);
            } else {
                finalReviewers.push(reviewer);
            }
        }
    });

    const params = {
        ...context.repo,
        pull_number: prNumber,
        reviewers: userRemovedReviewers,
    };
    if (debug) {
        info(`Request params:`);
        info(JSON.stringify(params, null, 2));
    }
    await client.pulls.requestReviewers(params);
}

run();