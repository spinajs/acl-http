export const UserSearchDtoSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "User search DTO",
    type: "object",
    properties: {
         Email: { type: "string", maxLength: 32 },
         NiceName: { type: "string", maxLength: 32 },
         Login: { type: "string", maxLength: 32 },
    },
}


export class UserSearchDto {
    public Email?: string;

    public NiceName?: string;

    public Login?: string;
}