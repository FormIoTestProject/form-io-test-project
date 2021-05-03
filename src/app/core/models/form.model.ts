export enum FormElelementTypes {
  CHECKBOX= 'checkbox',
  SELECT = 'select',
  TEXTFIELD = 'textfield',
  BUTTON = 'button'
}

export interface Entity {
  role: string;
  role_id: string;
  role_description: string;
  created_date: string;
}

export interface Submission {
  data: { [key: string]: any };
  metadata: { [key: string]: any };
  state: string;
}
