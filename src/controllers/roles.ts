import { BaseController, Get, BasePath, Query, LimitDto, OrderDto, NotFound, Ok } from '@spinajs/http';
import { Resource, Permission } from "../decorators";
import { Role } from '@spinajs/acl';


@BasePath("roles")
@Resource("users")
export class Roles extends BaseController {
    
    @Get("/")
    @Permission("get")
    public async list(@Query() limit: LimitDto, @Query() order: OrderDto) {

        const query = Role.all();

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
}