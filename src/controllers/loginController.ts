import { SessionProvider } from '@spinajs/acl';
import { LoginDto } from './../dto/login-dto';
import { BaseController, BasePath, Post, Body, Forbidden, Ok, Get } from '@spinajs/http';
import { AuthProvider } from '@spinajs/acl';
import * as express from "express";
 
@BasePath("auth")
export class LoginController extends BaseController {

    @Post()
    public async login(@Body() credentials: LoginDto) {

        const auth = this.Container.resolve<AuthProvider>(AuthProvider);
        const user = await auth.authenticate(credentials.Login, credentials.Password);

        if (user) {

            const sessionProvider = this.Container.resolve<SessionProvider>(SessionProvider);
            await sessionProvider.updateSession({
                SessionId: "s",
                Expiration: null,
                Data: user
            });

            return new Ok(user);
        }


        return new Forbidden({
            error: {
                message: "login or password incorrect"
            }
        });
    }

    @Get()
    public async logout(req: express.Request)
    {
        const ssid: string = (req.get("X-ssid") as string) ?? req.query.ssid as string;
        const sessionProvider = this.Container.resolve<SessionProvider>(SessionProvider);
        
        await sessionProvider.deleteSession(ssid);

        return new Ok();
    }

}