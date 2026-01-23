# Form — High-performance form component with data domain management. Includes data entry, validation, and corresponding styles.

## Overview

High-performance form component with data domain management. Includes data entry, validation, and corresponding styles.

## When To Use

- Use Form to high-performance form component with data domain management. Includes data entry, validation, and corresponding styles.
## Input Fields

### Form Props

#### Required

- No required properties.

#### Optional

- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `colon`: boolean, Configure the default value of `colon` for Form.Item. Indicates whether the colon after the label is displayed (only effective when prop layout is horizontal). Default true.
- `disabled`: boolean, Set form component disable, only available for antd components. Default false. Version 4.21.0.
- `component`: ComponentType | false, Set the Form rendering element. Do not create a DOM node for `false`. Default form.
- `fields`: [FieldData](#fielddata)\[], Control of form fields through state management (such as redux). Not recommended for non-strong demand. View [example](#form-demo-global-state).
- `form`: [FormInstance](#forminstance), Form control instance created by `Form.useForm()`. Automatically created when not provided.
- `feedbackIcons`: [FeedbackIcons](#feedbackicons), Can be passed custom icons while `Form.Item` element has `hasFeedback`. Version 5.9.0.
- `initialValues`: object, Set value by Form initialization or reset.
- `labelAlign`: `left` | `right`, The text align of label of all items. Default `right`.
- `labelWrap`: boolean, whether label can be wrap. Default false. Version 4.18.0.
- `labelCol`: [object](/components/grid/#col), Label layout, like `<Col>` component. Set `span` `offset` value like `{span: 3, offset: 12}` or `sm: {span: 3, offset: 12}`.
- `layout`: `horizontal` | `vertical` | `inline`, Form layout. Default `horizontal`.
- `name`: string, Form name. Will be the prefix of Field `id`.
- `preserve`: boolean, Keep field value even when field removed. You can get the preserve field value by `getFieldsValue(true)`. Default true. Version 4.4.0.
- `requiredMark`: boolean | `optional` | ((label: ReactNode, info: { required: boolean }) => ReactNode), Required mark style. Can use required mark or optional mark. You can not config to single Form.Item since this is a Form level config. Default true. Version `renderProps`: 5.9.0.
- `scrollToFirstError`: boolean | [Options](https://github.com/stipsan/scroll-into-view-if-needed/tree/ece40bd9143f48caf4b99503425ecb16b0ad8249#options) | { focus: boolean }, Auto scroll to first failed field when submit. Default false. Version focus: 5.24.0.
- `size`: `small` | `middle` | `large`, Set field component size (antd components only).
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `validateMessages`: [ValidateMessages](https://github.com/ant-design/ant-design/blob/6234509d18bac1ac60fbb3f92a5b2c6a6361295a/components/locale/en_US.ts#L88-L134), Validation prompt template, description [see below](#validatemessages).
- `validateTrigger`: string | string\[], Config field validate trigger. Default `onChange`. Version 4.3.0.
- `variant`: `outlined` | `borderless` | `filled` | `underlined`, Variant of components inside form. Default `outlined`. Version 5.13.0 | `underlined`: 5.24.0.
- `wrapperCol`: [object](/components/grid/#col), The layout for input controls, same as `labelCol`.
- `onFieldsChange`: function(changedFields, allFields), Trigger when field updated.
- `onFinish`: function(values), Trigger after submitting the form and verifying data successfully.
- `onFinishFailed`: function({ values, errorFields, outOfDate }), Trigger after submitting the form and verifying data failed.
- `onValuesChange`: function(changedValues, allValues), Trigger when value updated.
- `clearOnDestroy`: boolean, Clear form values when the form is uninstalled. Default false. Version 5.18.0.

### Form.Item Props

#### Required

- No required properties.

#### Optional

- `colon`: boolean, Configure the default value of `colon` for Form.Item. Indicates whether the colon after the label is displayed (only effective when prop layout is horizontal). Default true.
- `dependencies`: [NamePath](#namepath)\[], Set the dependency field. See [below](#dependencies).
- `extra`: ReactNode, The extra prompt message. It is similar to help. Usage example: to display error message and prompt message at the same time.
- `getValueFromEvent`: (..args: any\[]) => any, Specify how to get value from event or other onChange arguments.
- `getValueProps`: (value: any) => Record<string, any>, Additional props with sub component (It's not recommended to generate dynamic function prop by `getValueProps`. Please pass it to child component directly). Version 4.2.0.
- `hasFeedback`: boolean | { icons: [FeedbackIcons](#feedbackicons) }, Used with `validateStatus`, this option specifies the validation status icon. Recommended to be used only with `Input`. Also, It can get feedback icons via icons prop. Default false. Version icons: 5.9.0.
- `help`: ReactNode, The prompt message. If not provided, the prompt message will be generated by the validation rule.
- `hidden`: boolean, Whether to hide Form.Item (still collect and validate value). Default false. Version 4.4.0.
- `htmlFor`: string, Set sub label `htmlFor`.
- `initialValue`: string, Config sub default value. Form `initialValues` get higher priority when conflict. Version 4.2.0.
- `label`: ReactNode, Label text. When there is no need for a label but it needs to be aligned with a colon, it can be set to null. Version null: 5.22.0.
- `labelAlign`: `left` | `right`, The text align of label of all items. Default `right`.
- `labelCol`: [object](/components/grid/#col), Label layout, like `<Col>` component. Set `span` `offset` value like `{span: 3, offset: 12}` or `sm: {span: 3, offset: 12}`.
- `messageVariables`: Record&lt;string, string>, The default validate field info, description [see below](#messagevariables). Version 4.7.0.
- `name`: string, Form name. Will be the prefix of Field `id`.
- `normalize`: (value, prevValue, prevValues) => any, Normalize value from component value before passing to Form instance. Do not support async.
- `noStyle`: boolean, No style for `true`, used as a pure field control. Will inherit parent Form.Item `validateStatus` if self `validateStatus` not configured. Default false.
- `preserve`: boolean, Keep field value even when field removed. You can get the preserve field value by `getFieldsValue(true)`. Default true. Version 4.4.0.
- `required`: boolean, Display required style. It will be generated by the validation rule. Default false.
- `rules`: [Rule](#rule)\[], Rules for field validation. Click [here](#form-demo-basic) to see an example.
- `shouldUpdate`: boolean | (prevValue, curValue) => boolean, Custom field update logic. See [below](#shouldupdate). Default false.
- `tooltip`: ReactNode | [TooltipProps & { icon: ReactNode }](/components/tooltip#api), Config tooltip info. Version 4.7.0.
- `trigger`: string, When to collect the value of children node. Click [here](#form-demo-customized-form-controls) to see an example. Default `onChange`.
- `validateFirst`: boolean | `parallel`, Whether stop validate on first rule of error for this field. Will parallel validate when `parallel` configured. Default false. Version `parallel`: 4.5.0.
- `validateDebounce`: number, Delay milliseconds to start validation. Version 5.9.0.
- `validateStatus`: string, The validation status. If not provided, it will be generated by validation rule. options: `success` `warning` `error` `validating`.
- `validateTrigger`: string | string\[], Config field validate trigger. Default `onChange`. Version 4.3.0.
- `valuePropName`: string, Props of children node, for example, the prop of Switch or Checkbox is `checked`. This prop is an encapsulation of `getValueProps`, which will be invalid after customizing `getValueProps`. Default `value`.
- `wrapperCol`: [object](/components/grid/#col), The layout for input controls, same as `labelCol`.
- `layout`: `horizontal` | `vertical` | `inline`, Form layout. Default `horizontal`.

### Form.List Props

#### Required

- No required properties.

#### Optional

- `children`: (fields: Field\[], operation: { add, remove, move }, meta: { errors }) => React.ReactNode, Render function.
- `initialValue`: any\[], Config sub default value. Form `initialValues` get higher priority when conflict. Version 4.9.0.
- `name`: string, Form name. Will be the prefix of Field `id`.
- `rules`: { validator, message }\[], Validate rules, only support customize validator. Should work with [ErrorList](#formerrorlist). Version 4.7.0.

### operation Props

#### Required

- No required properties.

#### Optional

- `add`: (defaultValue?: any, insertIndex?: number) => void, add form item. Default insertIndex. Version 4.6.0.
- `move`: (from: number, to: number) => void, move form item.
- `remove`: (index: number | number\[]) => void, remove form item. Default number\[]. Version 4.5.0.

### Form.ErrorList Props

#### Required

- No required properties.

#### Optional

- `errors`: ReactNode\[], Error list.

### name Props

#### Required

- No required properties.

#### Optional

- `onFormChange`: function(formName: string, info: { changedFields, forms }), .
- `onFormFinish`: function(formName: string, info: { values, forms }), .

### FormInstance Props

#### Required

- No required properties.

#### Optional

- `getFieldError`: (name: [NamePath](#namepath)) => string\[], Get the error messages by the field name.
- `getFieldInstance`: (name: [NamePath](#namepath)) => any, Get field instance. Default 4.4.0. Version 4.4.0.
- `getFieldsError`: (nameList?: [NamePath](#namepath)\[]) => FieldError\[], Get the error messages by the fields name. Return as an array.
- `getFieldsValue`: [GetFieldsValue](#getfieldsvalue), Get values by a set of field names. Return according to the corresponding structure. Default return mounted field value, but you can use `getFieldsValue(true)` to get all values.
- `getFieldValue`: (name: [NamePath](#namepath)) => any, Get the value by the field name.
- `isFieldsTouched`: (nameList?: [NamePath](#namepath)\[], allTouched?: boolean) => boolean, Check if fields have been operated. Check if all fields is touched when `allTouched` is `true`.
- `isFieldTouched`: (name: [NamePath](#namepath)) => boolean, Check if a field has been operated.
- `isFieldValidating`: (name: [NamePath](#namepath)) => boolean, Check field if is in validating.
- `resetFields`: (fields?: [NamePath](#namepath)\[]) => void, Reset fields to `initialValues`.
- `scrollToField`: (name: [NamePath](#namepath), options: [ScrollOptions](https://github.com/stipsan/scroll-into-view-if-needed/tree/ece40bd9143f48caf4b99503425ecb16b0ad8249#options) | { focus: boolean }) => void, Scroll to field position. Default focus: 5.24.0. Version focus: 5.24.0.
- `setFields`: (fields: [FieldData](#fielddata)\[]) => void, Set fields status.
- `setFieldValue`: (name: [NamePath](#namepath), value: any) => void, Set fields value(Will directly pass to form store and **reset validation message**. If you do not want to modify passed object, please clone first). Default 4.22.0. Version 4.22.0.
- `setFieldsValue`: (values) => void, Set fields value(Will directly pass to form store and **reset validation message**. If you do not want to modify passed object, please clone first). Use `setFieldValue` instead if you want to only config single value in Form.List.
- `submit`: () => void, Submit the form. It's same as click `submit` button.
- `validateFields`: (nameList?: [NamePath](#namepath)\[], config?: [ValidateConfig](#validatefields)) => Promise, Validate fields. Use `recursive` to validate all the field in the path.

### FieldData Props

#### Required

- No required properties.

#### Optional

- `errors`: string\[], Error messages.
- `warnings`: string\[], Warning messages.
- `name`: [NamePath](#namepath)\[], Field name path.
- `touched`: boolean, Whether is operated.
- `validating`: boolean, Whether is in validating.
- `value`: any, Field value.

### Rule Props

#### Required

- No required properties.

#### Optional

- `defaultField`: [rule](#rule), Validate rule for all array elements, valid when `type` is `array`.
- `enum`: any\[], Match enum value. You need to set `type` to `enum` to enable this.
- `fields`: Record&lt;string, [rule](#rule)>, Validate rule for child elements, valid when `type` is `array` or `object`.
- `len`: number, Length of string, number, array.
- `max`: number, `type` required: max length of `string`, `number`, `array`.
- `message`: string | ReactElement, Error message. Will auto generate by [template](#validatemessages) if not provided.
- `min`: number, `type` required: min length of `string`, `number`, `array`.
- `pattern`: RegExp, Regex pattern.
- `required`: boolean, Required field.
- `transform`: (value) => any, Transform value to the rule before validation.
- `type`: string, Normally `string` |`number` |`boolean` |`url` | `email` | `tel`. More type to ref [here](https://github.com/react-component/async-validator#type).
- `validateTrigger`: string | string\[], Set validate trigger event. Must be the sub set of `validateTrigger` in Form.Item.
- `validator`: ([rule](#rule), value) => Promise, Customize validation rule. Accept Promise as return. See [example](#form-demo-register).
- `warningOnly`: boolean, Warning only. Not block form submit. Default 4.17.0. Version 4.17.0.
- `whitespace`: boolean, Failed if only has whitespace, only work with `type: 'string'` rule.

### WatchOptions Props

#### Required

- No required properties.

#### Optional

- `form`: FormInstance, Form instance. Default Current form in context. Version 5.4.0.
- `preserve`: boolean, Whether to watch the field which has no matched `Form.Item`. Default false. Version 5.4.0.

## Methods

No public methods.

## Scenario

### Layout scenarios

| Scenario | layout | Notes |
| --- | --- | --- |
| Horizontal (default) | `horizontal` | Use `labelCol` and `wrapperCol` to align labels and controls on the grid. |
| Vertical | `vertical` | Labels are placed above controls; no `labelCol`/`wrapperCol` needed. |
| Inline | `inline` | Items are arranged in a row; best for compact filters and search. |

### Label and wrapper layout

| Prop | Description | Example |
| --- | --- | --- |
| `labelCol` | Label layout, same as `<Col>` with `span`/`offset`. | `{ span: 4 }` |
| `wrapperCol` | Input control layout, same as `labelCol`. | `{ span: 20 }` |

### Item-level layout override

| Scenario | Approach |
| --- | --- |
| Override a single item layout | Set `layout` or `labelCol`/`wrapperCol` on `Form.Item`. |

## Common Scenario Examples

### Scenario 1: Basic Usage

```tsx
import { Button, Form, Input, Space } from 'antd';

interface LoginFormData {
  username: string;
  password: string;
}

const LoginForm: React.FC = () => {
  const [form] = Form.useForm<LoginFormData>();

  return (
    <Form form={form} layout="vertical" onFinish={(values) => console.log('Login:', values)}>
      <Form.Item
        label="Username"
        name="username"
        rules={[{ required: true, message: 'Please enterUsername' }]}
      >
        <Input placeholder="Please enterUsername" />
      </Form.Item>
      <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please enterPassword' }]}>
        <Input.Password placeholder="Please enterPassword" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" block htmlType="submit">
          Login
        </Button>
      </Form.Item>
    </Form>
  );
};
```

### Scenario 2: Form methods

```tsx
import { Form, Input, Button } from 'antd';

const ComplexValidationForm: React.FC = () => {
  const [form] = Form.useForm();

  return (
    <Form form={form} layout="vertical" onFinish={console.log}>
      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: 'EmailRequired' }, { type: 'email', message: 'EmailInvalid format' }, ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Age"
        name="age"
        rules={[
          { required: true, message: 'AgeRequired' }, { type: 'number', message: 'AgeText' }, { min: 18, message: 'AgeText 18' }, { max: 120, message: 'AgeText 120' }, ]}
      >
        <Input type="number" />
      </Form.Item>
      <Form.Item
        label="TextPassword"
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: 'TextPassword' }, ({ getFieldValue }) => ({\n            validator: async (_, value) => {\n              if (!value || getFieldValue('password') === value) {\n                return Promise.resolve();\n              }\n              return Promise.reject(new Error('Text'));\n            }, \n          }), ]}
      >
        <Input.Password />
      </Form.Item>
      <Button type="primary" htmlType="submit">Submit</Button>
    </Form>
  );
};
```

### Scenario 3: Form Layout

```tsx
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Space } from 'antd';

const DynamicFieldsForm: React.FC = () => {
  const [form] = Form.useForm();

  return (
    <Form form={form} layout="vertical" onFinish={console.log}>
      <Form.List name="members">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => (
              <Space key={field.key} style={{ width: '100%' }} align="baseline">
                <Form.Item
                  {.field}
                  name={[field.name, 'name']}
                  rules={[{ required: true, message: 'TextRequired' }]}
                >
                  <Input placeholder="Text" />
                </Form.Item>
                <Form.Item
                  {.field}
                  name={[field.name, 'email']}
                  rules={[{ required: true, type: 'email', message: 'EmailRequired' }]}
                >
                  <Input placeholder="Email" />
                </Form.Item>
                <MinusCircleOutlined onClick={() => remove(field.name)} />
              </Space>
            ))}
            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
              Text
            </Button>
          </>
        )}
      </Form.List>
      <Button type="primary" htmlType="submit">
        Submit
      </Button>
    </Form>
  );
};
```

### Scenario 4: Form mix layout

```tsx
import { Button, Form, Input, Select } from 'antd';

const DependentFieldsForm: React.FC = () => {
  const [form] = Form.useForm();
  const userType = Form.useWatch('userType', form);

  return (
    <Form form={form} layout="vertical" onFinish={console.log}>
      <Form.Item label="Text" name="userType" rules={[{ required: true, message: 'Text' }]}>
        <Select
          options={[
            { value: 'individual', label: 'Text' }, { value: 'company', label: 'Text' }, ]}
        />
      </Form.Item>

      {userType === 'individual' && (
        <Form.Item
          label="Text"
          name="idCard"
          rules={[{ required: true, message: 'TextRequired' }]}
        >
          <Input />
        </Form.Item>
      )}

      {userType === 'company' && (
        <Form.Item
          label="Text"
          name="businessLicense"
          rules={[{ required: true, message: 'TextRequired' }]}
        >
          <Input />
        </Form.Item>
      )}

      <Button type="primary" htmlType="submit">
        Submit
      </Button>
    </Form>
  );
};
```

### Scenario 5: Form disabled

```tsx
import { useState } from 'react';
import { Button, Form, Input, Space } from 'antd';

const ExternalControlForm: React.FC = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState<any>(null);

  const handleReset = () => form.resetFields();
  const handleFill = () => form.setFieldsValue({ username: 'admin', password: '123456' });
  const handleGet = async () => {
    try {
      const values = await form.validateFields();
      setData(values);
    } catch (e) {
      console.error('Text');
    }
  };

  return (
    <>
      <Form form={form} layout="vertical" onFinish={setData}>
        <Form.Item name="username" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="password" rules={[{ required: true }]}>
          <Input.Password />
        </Form.Item>
      </Form>
      <Space>
        <Button onClick={handleReset}>Text</Button>
        <Button onClick={handleFill}>Text</Button>
        <Button onClick={handleGet}>Text</Button>
      </Space>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </>
  );
};
```

## Usage Recommendations

Use Form to high-performance form component with data domain management. Includes data entry, validation, and corresponding styles.

## Example Code

```tsx
import { Button, Form, Input } from 'antd';

interface FieldType {
  username: string;
  password: string;
}

const App: React.FC = () => {
  const [form] = Form.useForm<FieldType>();

  return (
    <Form
      form={form}
      name="login"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      onFinish={(values) => console.log('Success:', values)}
    >
      <Form.Item<FieldType>
        label="Username"
        name="username"
        rules={[{ required: true, message: 'Please input username!' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item<FieldType>
        label="Password"
        name="password"
        rules={[{ required: true, message: 'Please input password!' }]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};
```

## Result

Renders a Form component.

## References
- Component docs: `https://ant.design/components/form` — use for API details, defaults, and official examples.