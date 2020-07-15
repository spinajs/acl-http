import { SessionProvider, Role } from '@spinajs/acl';
import { LoginDto } from './../dto/login-dto';
import { BaseController, BasePath, Post, Body, Ok, Get, Cookie, CookieResponse, Unauthorized } from '@spinajs/http';
import { AuthProvider, Session } from '@spinajs/acl';
import { Autoinject } from '@spinajs/di';
import { Configuration } from '@spinajs/configuration';

@BasePath('auth')
export class LoginController extends BaseController {
  @Autoinject()
  protected Configuration: Configuration;

  @Post()
  public async login(@Body() credentials: LoginDto) {
    const auth = this.Container.resolve<AuthProvider>(AuthProvider);
    const user = await auth.authenticate(credentials.Login, credentials.Password);

    if (user) {
      const ttl = this.Configuration.get<number>('acl.session.expiration', 10);
      const lifetime = new Date();
      lifetime.setMinutes(lifetime.getMinutes() + ttl);

      const uObject = {
        Login: user.Login,
        Email: user.Email,
        NiceName: user.NiceName,
        Metadata: user.Metadata.map(m => ({ Key: m.Key, Value: m.Value })),
        Roles: user.Roles.map(r => _mapRole(r)),
      };

      const session = new Session({
        Data: uObject,
        Expiration: lifetime,
      });

      const sessionProvider = await this.Container.resolve<SessionProvider>(SessionProvider);
      await sessionProvider.updateSession(session);

      return new CookieResponse('ssid', session.SessionId, ttl, uObject);
    }

    return new Unauthorized({
      error: {
        message: 'login or password incorrect',
      },
    });

    function _mapRole(r: Role): any {
      if (r === null) {
        return null;
      }

      return {
        Slug: r.Slug,
        Resources: r.Resources.map(r => ({ Slug: r.Slug, Permission: r.Permission })),
        Parent: _mapRole(r.Parent),
      };
    }
  }

  @Get()
  public async logout(@Cookie() ssid: string) {
    if (!ssid) {
      return new Ok();
    }

    const ttl = this.Configuration.get<number>('acl.session.expiration', 10);
    const sessionProvider = await this.Container.resolve<SessionProvider>(SessionProvider);
    await sessionProvider.deleteSession(ssid);

    // send empty cookie to confirm session deletion
    return new CookieResponse('ssid', null, ttl);
  }
}
