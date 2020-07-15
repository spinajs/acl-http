import { PasswordDto } from './../dto/password-dto';
import { UserDto } from './../dto/user-dto';
import { User,  PasswordProvider, UserToRole, Role } from '@spinajs/acl';
import {
  BaseController,
  BasePath,
  Post,
  Get,
  Del,
  Put,
  Query,
  Ok,
  NotFound,
  Body,
  IncPkey,
  Param
} from '@spinajs/http';
import { Resource, Permission } from '../decorators';
import { InvalidArgument } from '@spinajs/exceptions';
import { InsertBehaviour } from '@spinajs/orm';

const OrderSchema = {
  type: "string",
  enum: ["asc", "dsc"]
};



@BasePath('users')
@Resource('users')
export class UsersController extends BaseController {
  @Get('/')
  @Permission('get')
  public async listUsers(@Query() search: string, @Query({ type: "number", min: 1 }) page: number, @Query({ type: "number", min: 1 }) perPage: number, @Query() order: string, @Query(OrderSchema) orderDirection: string) {
    const query = User.all();
    query.whereNull("DeletedAt");
    
    if (search) {
      query.where(function () {
        this.where('Email', 'like', `%${search}%`);
        this.orWhere('Login', 'like', `${search}%`);
        this.orWhere('NiceName', 'like', `%${search}%`);
      });
    }

    if (page && perPage) {
      query.skip((page - 1) * perPage).take(perPage);
    }

    if (order && orderDirection) {
      switch (orderDirection) {
        case 'asc':
          query.orderBy(order);
          break;
        case 'asc':
          query.orderByDescending(order);
          break;
      }
    }

    query.populate("Roles").populate("Metadata");

    const result = await query;

    result.forEach(r => delete r.Password);

    if (result.length === 0) {
      return new NotFound('no users met search criteria');
    }

    return new Ok(result);
  }

  @Get(':id')
  @Permission('get')
  public async getUser(@IncPkey() id: number) {
    const user = await User.where({
      Id: id,
    }).whereNull("DeletedAt")
      .populate('Metadata')
      .populate('Roles')
      .firstOrFail();

    return new Ok(user);
  }

  @Post('/')
  @Permission('put')
  public async addUser(@Body() user: UserDto) {
    const password = this.Container.resolve<PasswordProvider>(PasswordProvider);
    if (user.Password !== user.ConfirmPassword) {
      throw new InvalidArgument('password does not match');
    }

    let hashedPassword = '';
    let userPassword = user.Password;

    if (!userPassword) {
      userPassword = password.generate();
    }

    hashedPassword = await password.hash(userPassword);
    const entity = new User({
      Email: user.Email,
      Login: user.Login,
      NiceName: user.NiceName,
      Password: hashedPassword,
      CreatedAt: new Date(),
    });

    await entity.save();

    return new Ok({ Id: entity.Id });
  }

  @Del(':id')
  @Permission('delete')
  public async deleteUser(@IncPkey() id: number) {
    const entity = await User.findOrFail<User>(id);

    await entity.destroy();

    return new Ok();
  }

  @Put(':id')
  @Permission('put')
  public async updateUser(@IncPkey() id: number, @Body() user: UserDto) {
    const entity = await User.findOrFail<User>(id);
    entity.Email = user.Email;
    entity.NiceName = user.NiceName;

    await entity.save();

    return new Ok();
  }

  @Put(':id/change-password')
  @Permission('put')
  public async updateUserPassword(@IncPkey() id: number, @Body() pwd: PasswordDto) {
    if (pwd.Password !== pwd.ConfirmPassword) {
      throw new InvalidArgument('password does not match');
    }

    const entity = await User.findOrFail<User>(id);
    const password = this.Container.resolve<PasswordProvider>(PasswordProvider);
    const hashedPassword = await password.hash(pwd.Password);

    entity.Password = hashedPassword;

    await entity.save();

    return new Ok();
  }

  @Put(':id/role/:slug')
  @Permission('put')
  public async assignRole(@IncPkey() id: number, @Param() slug: string) {

    const role = await Role.where("Slug", slug).firstOrFail<Role>();

    /**
     * we done use relation, fk constraint guarantee valid data
     */
    const rel = new UserToRole();
    rel.role_id = role.Id;
    rel.user_id = id;

    await rel.save(InsertBehaviour.OnDuplicateIgnore);

    return new Ok();
  }

  @Del(':id/role/:slug')
  @Permission('del')
  public async deleteRole(@IncPkey() id: number, @Param() slug: string) {
    const role = await Role.where("Slug", slug).firstOrFail<Role>();
    const rel = await UserToRole.where({
      user_id: id,
      role_id: role.Id,
    }).first<UserToRole>();

    if (rel) {
      await rel.destroy();
    }

    return new Ok();
  }
}
