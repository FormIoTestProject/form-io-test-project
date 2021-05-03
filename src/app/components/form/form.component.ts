import { Component, EventEmitter, OnInit } from '@angular/core';
import { FormioForm, FormioOptions, FormioRefreshValue } from 'angular-formio';
import { Entity, FormElelementTypes, Submission } from '../../core/models/form.model';
import mockData from '../../core/mock/mock.data.json';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent implements OnInit {
  public myForm: FormioForm;
  public data: any;
  refreshFormEmitter = new EventEmitter<FormioRefreshValue>();

  optionsJSON: FormioOptions = {
    hooks: {
      beforeSubmit: (submission: Submission, callback) => {
        const submitData = submission.data;
        const selectedOptions = submitData.values_select;
        const dataToSubmit = {
          values_select: selectedOptions
        };

        for (const optionName of selectedOptions) {
          const checkboxKey =  `${ optionName }_${ FormElelementTypes.CHECKBOX }`;
          for (const [key, value] of Object.entries(submitData)) {
            if (key === checkboxKey && value) {
              dataToSubmit[key] = submitData[`${ optionName }_${ FormElelementTypes.TEXTFIELD }`];
            }
          }
        }

        submission.data = dataToSubmit;
        callback(null, submission);
      }
    }
  };

  constructor() {
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.myForm = this.generateInitialForm();
  }

  checkChanges(event: any): void {
    this.data = event?.data;
    const changes = event.changed;

    if (!changes) {
      return;
    }

    const { type, value } = changes.component;

    switch (type) {
      case FormElelementTypes.SELECT:
        this.updateCheckboxView(changes.value);
        this.setSubmitBtnDisabled(!this.isValidForm());
        break;
      case FormElelementTypes.CHECKBOX:
        this.toggleTextField(value);
        break;
      case FormElelementTypes.TEXTFIELD:
        break;
    }
    this.refreshForm();
  }

  updateCheckboxView(selectedValues: string[]): void {
    const allValues = this.getComponentByKey(FormElelementTypes.SELECT, 'values')?.data?.values;

    for (const item of allValues) {
      if (selectedValues.includes(item.value)) {
        this.showCheckbox(item.value);
      } else {
        this.hideCheckboxWithTextField(item.value);
      }
    }
  }

  toggleTextField(key: string): void {
    const textFieldComponent = this.getComponentByKey(FormElelementTypes.TEXTFIELD, key);
    textFieldComponent.hidden = !textFieldComponent.hidden;
  }

  isValidForm(): boolean {
    return this.myForm.components.some(comp => comp.type === FormElelementTypes.CHECKBOX && !comp.hidden);
  }

  setSubmitBtnDisabled(status: boolean): void {
    const submit = this.myForm.components.find(comp => comp.key === 'submit');
    submit.disabled = status;
  }


  showCheckbox(key: string): void {
    const checkbox = this.getComponentByKey(FormElelementTypes.CHECKBOX, key);
    if (checkbox.hidden) {
      checkbox.hidden = false;
    }
  }

  getComponentByKey(type: string, key: string): any {
    return this.myForm.components.find(comp => comp.key === `${ key }_${ type }`);
  }

  hideCheckboxWithTextField(key: string): void {
    const checkbox = this.getComponentByKey(FormElelementTypes.CHECKBOX, key);
    const textfield = this.getComponentByKey(FormElelementTypes.TEXTFIELD, key);
    this.data[`${ key }_${ FormElelementTypes.CHECKBOX }`] = false;
    checkbox.hidden = true;
    textfield.hidden = true;
  }

  generateInitialForm(): FormioForm {
    const formMappings: Entity[] = mockData.mappings;
    return {
      components: [
        {
          type: 'select',
          label: 'Select',
          key: 'values_select',
          placeholder: 'These are a few of your Select...',
          data: {
            values: formMappings.map(item => ({ value: item.role_id, label: item.role }))
          },
          dataSrc: 'values',
          template: '<span>{{ item.value }}</span>',
          multiple: true,
          input: true
        },
        ...formMappings.reduce((acc, item) => ([
          ...acc,
          {
            label: item.role_id,
            tableView: false,
            type: FormElelementTypes.CHECKBOX,
            input: true,
            key: `${ item.role_id }_${ FormElelementTypes.CHECKBOX }`,
            customClass: 'form-checkbox',
            value: item.role_id,
            hidden: true,
            defaultValue: false
          },
          {
            label: 'textfield',
            hideLabel: true,
            tableView: true,
            key: `${ item.role_id }_${ FormElelementTypes.TEXTFIELD }`,
            type: FormElelementTypes.TEXTFIELD,
            hidden: true,
            customClass: 'form-textfield',
            defaultValue: item.role_description,
            input: true,
          }
        ]), []),
        {
          type: FormElelementTypes.BUTTON,
          label: 'Submit',
          key: 'submit',
          disableOnInvalid: true,
          input: true,
          customClass: 'form-submit-button',
          tableView: false,
          disabled: true,
        }
      ]
    };
  }

  refreshForm(): void {
    this.refreshFormEmitter.emit({
      form: this.myForm
    });
  }


  exportJSON(event: any): void {
    const dataStr = JSON.stringify(event.data);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = 'data.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
}
