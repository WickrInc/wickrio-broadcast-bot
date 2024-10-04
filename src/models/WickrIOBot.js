// @ts-nocheck
import * as WickrIOBotAPI from 'wickrio-bot-api'

export default class WickrIOBot {
    static instance = null;
    
    constructor() {
        if (WickrIOBot.instance) {
            return WickrIOBot.instance;
        }

        this.botInstance = new WickrIOBotAPI.WickrIOBot();
        WickrIOBot.instance = this;
    }

    static getInstance() {
        if (!WickrIOBot.instance) { 
            WickrIOBot.instance = new WickrIOBot();
        }
        return WickrIOBot.instance.botInstance;
    }
}