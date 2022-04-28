'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const token = (0, core_1.getInput)('token');
        const payload = github_1.context.payload;
        if (!payload.pull_request) {
            return;
        }
        const prNumber = payload.pull_request.number;
        const pullRequestBody = payload.pull_request.body || '';
        const matchStr = pullRequestBody.match(/<!-- Record Reviewer -->((.|\r|\n|\r\n)*)<!-- End Reviewer -->/);
        if (!matchStr || !matchStr[1]) {
            (0, core_1.info)('No Reviewer found');
            return;
        }
        const results = matchStr[1].replace(/(\r\n|\r|\n)/g, ' ').split(' ').filter(str => !!str);
        const reviewers = [];
        results.forEach((str) => {
            str = str.trim();
            if (str.startsWith('@')) {
                reviewers.push(str.substr(1));
            }
        });
        const client = (0, github_1.getOctokit)(token);
        const params = Object.assign(Object.assign({}, github_1.context.repo), { pull_number: prNumber, reviewers: reviewers });
        yield client.pulls.requestReviewers(params);
    });
}
exports.run = run;
run();
