import { Schema } from "@spinajs/http";

export const PasswordDtoSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    title: "User password DTO",
    type: "object",
    properties: [
        { UserId: { type: "number" } },
        { OldPassword: { type: "string", maxLength: 32, minLength: 6 } },
        { NewPassword: { type: "string", maxLength: 32, minLength: 6 } },
        { ConfirmPassword: { type: "string", maxLength: 32, minLength: 6 } },
    ],
    required: ["OldPassword", "NewPassword", "ConfirmPassword"]
}

@Schema(PasswordDto)
export class PasswordDto {

    public OldPassword: string;

    public NewPassword: string;

    public ConfirmPassword: string;
}
