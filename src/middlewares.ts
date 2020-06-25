import { SessionProvider, ISession, User } from "@spinajs/acl";
import { DI } from "@spinajs/di";
import 'reflect-metadata'
import * as express from 'express';


/**
 * global express middleware that loads user from session
 * 
 * @param req 
 * @param res 
 * @param next 
 */
export function UserFromSession() {
    const wrapper = (req: express.Request, _res: express.Response, next: express.NextFunction) => {

        const ssid: string = (req.get("X-ssid") as string) ?? req.query.ssid as string;

        if (ssid) {
            const provider = DI.resolve(SessionProvider)
            provider.restoreSession(ssid).then((session: ISession) => {
                req.User = new User(session.Data);
                next();
            }).catch(err => next(err));
        } else {
            req.User = null;
            next();
        }
    };

    Object.defineProperty(wrapper, "name", {
        value: "userFromSession",
        writable: true
    });	  

    return wrapper;
}

