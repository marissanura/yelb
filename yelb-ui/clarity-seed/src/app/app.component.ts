import { Component, OnInit, Injectable, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { environment } from "../environments/environment";
import { EnvService } from "../app/env.service";
import { Headers, Http, Response } from "@angular/http";
import { Observable } from "rxjs/Observable";
import { $WebSocket } from "angular2-websocket/angular2-websocket";
import "rxjs/add/operator/map";

@Injectable()
@Component({
    selector: "yelb",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, OnDestroy {
    constructor(
        private router: Router,
        private http: Http,
        private env: EnvService
    ) {}

    /** Here we set the appserver endpoint.
     * If you are using the nginx redirect method (used in the bare metal, EC2 and containers deployment) leave it as is:
     * >> public appserver    =    environment.appserver_env;
     * If you want to take advantage of the env.js file (used in the serverless S3 static web hosting use case) then change it to:
     * >> public appserver    =    this.env.apiUrl;
     * This will set the endpoint to the value found in env.js (right now this change needs to be done at build time e.g. via sed)
     * For reference: support for reading the env.js file has been introduced following these steps:
     * https://www.jvandemo.com/how-to-use-environment-variables-to-configure-your-angular-application-without-a-rebuild/
     **/

    public appserver = environment.appserver_env;

    ws = new $WebSocket(
        this.appserver.replace(/^https?:\/\//, "ws://"),
        undefined,
        {
            reconnectIfNotNormalClose: true,
        }
    );

    colorScheme = {
        domain: ["#5AA454", "#A10A28", "#C7B42C", "#AAAAAA"],
    };
    votes: any[] = [];
    stats: any;
    hostname: any;
    pageviews: any;
    gradient: boolean;
    view: any[] = [700, 200];

    safeJsonParse(str: any) {
        try {
            return [null, JSON.parse(str)];
        } catch (err) {
            return [err, null];
        }
    }

    ngOnInit() {
        // this.getvotes();
        this.getstats();

        this.ws.getDataStream().subscribe((msg) => {
            const [err, data] = this.safeJsonParse(msg.data);
            if (!err) {
                this.votes = data;
            }
        });
    }

    ngOnDestroy() {
        this.ws.close(true);
    }

    getvotes(): void {
        const url = `${this.appserver}/api/getvotes`;
        console.log("connecting to app server " + url);
        this.http
            .get(url)
            .map((res: Response) => res.json())
            .subscribe((res) => {
                console.log(res);
                this.votes = res;
            });
    }

    getstats(): void {
        const url = `${this.appserver}/api/getstats`;
        console.log("connecting to app server " + url);
        this.http
            .get(url)
            .map((res: Response) => res.json())
            .subscribe((res) => {
                console.log(res, res.hostname, res.pageviews);
                this.stats = res;
            });
    }

    vote(restaurant: string): void {
        const url = `${this.appserver}/api/${restaurant}`;
        console.log("connecting to app server " + url);
        this.http
            .get(url)
            .map((res: Response) => res.json())
            .subscribe((res) => {
                console.log(res);
            });
        // this.getvotes();
    }
}
