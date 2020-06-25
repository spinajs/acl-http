import { PasswordDto } from './../dto/password-dto';
import { UserDto } from './../dto/user-dto';
import { User, AuthProvider, PasswordProvider, UserToRole } from '@spinajs/acl';
import { UserSearchDto } from './../dto/user-search-dto';
import { BaseController, BasePath, Post, Get, Del, Put, LimitDto, Query, OrderDto, Ok, NotFound, Body, IncPkey } from "@spinajs/http";
import { Resource, Permission } from "../decorators";
import { InvalidArgument } from "@spinajs/exceptions";
import { InsertBehaviour} from "@spinajs/orm";
 

@BasePath("users")
@Resource("users")
export class UsersController extends BaseController {


    @Get("/")
    @Permission("get")
    public async listUsers(@Query() search: UserSearchDto, @Query() limit: LimitDto, @Query() order: OrderDto) {

        const query = User.all();

        if (search) {
            query.where(function () {

                if (search.Email) {
                    this.where("Email", "like", search.Email);
                }

                if (search.Login) {
                    this.orWhere("Login", "like", search.Login);
                }

                if (search.NiceName) {
                    this.orWhere("NiceName", "like", search.NiceName);
                }

            });
        }

        if (limit) {
            query.skip(limit.Page * limit.PerPage).take(limit.PerPage);
        }

        if (order) {
            switch (order.Order) {
                case "asc": query.orderBy(order.Column); break;
                case "asc": query.orderByDescending(order.Column); break;
            }
        }

        const result = await query;

        if (result.length === 0) {
            return new NotFound("no users met search criteria");
        }

        return new Ok(result);
    }


    @Get("user/:id")
    @Permission("get")
    public async getUser(@IncPkey() id: number) {
        const user = await User.where({
            Id: id
        }).populate("Metadata")
            .populate("Groups")
            .populate("Roles");
        return new Ok(user);
    }

    @Post("/")
    @Permission("put")
    public async addUser(@Body() user: UserDto) {

        const auth = this.Container.resolve<AuthProvider>(AuthProvider);
        const password = this.Container.resolve<PasswordProvider>(PasswordProvider);

        if (user.Password !== user.ConfirmPassword) {
            throw new InvalidArgument("password does not match");
        }

        let hashedPassword = "";
        let userPassword = user.Password;

        if (!userPassword) {
            userPassword = password.generate();
        }

        hashedPassword = await password.hash(userPassword);
        const entity = new User({
            Email: user.Login,
            DisplayName: user.NiceName,
            Password: hashedPassword,
            CreatedAt: new Date(),
        });

        const exists = await auth.exists(entity);
        if (exists) {
            throw new InvalidArgument(`user already exists`);
        }

        await entity.save();

        return new Ok(entity);
    }

    @Del(":id")
    @Permission("delete")
    public async deleteUser(@IncPkey() id: number) {

        const entity = await User.findOrFail<User>(id);

        await entity.destroy();

        return new Ok();
    }

    @Put(":id")
    @Permission("put")
    public async updateUser(@Body() user: UserDto) {

        const entity = await User.findOrFail<User>(user.Id);
        entity.Email = user.Email;
        entity.NiceName = user.NiceName;

        await entity.save();

        return new Ok();
    }

    @Put(":id/change-password")
    @Permission("put")
    public async updateUserPassword(@IncPkey() id: number, @Body() pwd: PasswordDto) {

        if (pwd.NewPassword !== pwd.ConfirmPassword) {
            throw new InvalidArgument("password does not match");
        }

        const entity = await User.findOrFail<User>(id);
        const password = this.Container.resolve<PasswordProvider>(PasswordProvider);
        const hashedPassword = await password.hash(pwd.NewPassword);

        entity.Password = hashedPassword;

        await entity.save();

        return new Ok();
    }

    @Put(":id/role/:roleId")
    public async assignRole(@IncPkey() id: number, @IncPkey() roleId: number) {
 
        /**
         * we done use relation, fk constraint guarantee valid data
         */
        const rel = new UserToRole();
        rel.role_id = roleId;
        rel.user_id = id;

        await rel.save(InsertBehaviour.OnDuplicateIgnore);

        return new Ok();
    }

    @Del(":id/role/:roleId")
    public async deleteRole(@IncPkey() id: number, @IncPkey() roleId: number) {

        const rel = await UserToRole.where({
            user_id: id,
            role_id: roleId
        }).first<UserToRole>();

        if (rel) {
            await rel.destroy();
        }

        return new Ok();
    }
}