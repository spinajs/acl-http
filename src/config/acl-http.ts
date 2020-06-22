import { UserFromSession } from "../middlewares";
import { join, normalize, resolve } from 'path';

function dir(path: string) {
    return resolve(normalize(join(__dirname, path)));
}
module.exports = {
    system: {
        dirs:{
            controllers: [dir("./../controllers")],
            locales: [dir("./../locales")],
            views: [dir("./../views")],
        }
    },
    http: {
        middlewares: [

            // add global user from session middleware
            UserFromSession()
        ]
    },
}