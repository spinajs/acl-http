import { Schema } from '@spinajs/http';

export const PasswordDtoSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'User password DTO',
  type: 'object',
  properties: {
    Password: { type: 'string', maxLength: 32, minLength: 6 },
    ConfirmPassword: { type: 'string', maxLength: 32, minLength: 6 },
  },
  required: ['Password', 'ConfirmPassword'],
};

@Schema(PasswordDtoSchema)
export class PasswordDto {
  public Password: string;

  public ConfirmPassword: string;
}
