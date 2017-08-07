// Copyright (C) 2017 Alaa Masoud
// See the LICENSE file in the project root for more information.

import { runInAction, observable, action } from 'mobx';
import { IHttpClient, HttpClient } from './HttpClient';
import ILogEntry from './interfaces/ILogEntry';
import ILogQuery from './interfaces/ILogQuery';

export default class Store {
    @observable logEntries: ILogEntry[] = [];
    @observable queries: ILogQuery[] = [];
    @observable queryText = '';
    private http: IHttpClient;
    private page = 1;
    private startingTimestamp: string | undefined = undefined;
    private rootUrl = window.location.pathname;

    constructor(http: IHttpClient = new HttpClient()) {
        this.http = http;
    }

    public async reset() {
        this.page = 1;
        this.startingTimestamp = undefined;
        this.logEntries = [];
        await this.loadEvents();
    }

    @action public async loadEvents() {
        const url = this.startingTimestamp
            ? `${this.rootUrl}/events?page=${this.page}&startingTs=${this.startingTimestamp}`
            : `${this.rootUrl}/events?page=${this.page}`;

        const json = await this.http.post(url, this.queryText);
        const events = JSON.parse(json) as ILogEntry[];

        if (events.length) {
            if (!this.startingTimestamp) {
                this.startingTimestamp = events[0].timestamp;
            }

            runInAction('load entries', () => this.logEntries = this.logEntries.concat(events));
            this.page++;
        }
    }

    @action public async saveQuery(name: string, query: string) {
        await this.http.post(`${this.rootUrl}/log-query`, JSON.stringify({ name, query }));
        runInAction('save query',
            () => {
                this.queries.push({
                    name,
                    query,
                });
            });
    }

    @action public async loadQueries() {
        const json = await this.http.get(`${this.rootUrl}/log-queries`);
        const queries = JSON.parse(json) as ILogQuery[];

        runInAction('load queries', () => this.queries = queries);
    }
}
