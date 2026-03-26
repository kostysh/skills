# Upload — Used to select and upload files or drag and drop files.

## Overview

Used to select and upload files or drag and drop files.

## When To Use

- When you need to upload one or more files.
- When you need to show the process of uploading.
- When you need to upload files by dragging and dropping.
## Input Fields

### Upload Props

#### Required

- No required properties.

#### Optional

- `accept`: string | [AcceptObject](#acceptobject), File types that can be accepted. See [input accept Attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#accept).
- `action`: string | (file) => Promise&lt;string>, Uploading URL.
- `beforeUpload`: (file: [RcFile](#rcfile), fileList: [RcFile[]](#rcfile)) => boolean | Promise&lt;File> | `Upload.LIST_IGNORE`, Hook function which will be executed before uploading. Uploading will be stopped with `false` or a rejected Promise returned. When returned value is `Upload.LIST_IGNORE`, the list of files that have been uploaded will ignore it. **Warning：this function is not supported in IE9**.
- `customRequest`: ( options: [RequestOptions](#request-options), info: { defaultRequest: (option: [RequestOptions](#request-options)) => void; } ) => void, Override for the default xhr behavior allowing for additional customization and the ability to implement your own XMLHttpRequest. Version defaultRequest: 5.28.0.
- `classNames`: Record<[SemanticDOM](#semantic-dom), string> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), string>, Customize class for each semantic structure inside the component. Supports object or function.
- `data`: object | (file) => object | Promise&lt;object>, Uploading extra params or function which can return uploading extra params.
- `defaultFileList`: object\[], Default list of files that have been uploaded.
- `directory`: boolean, Support upload whole directory ([caniuse](https://caniuse.com/#feat=input-file-directory)). Default false.
- `disabled`: boolean, Disable upload button. Default false. Version When customizing Upload children, please pass the disabled attribute to the child node at the same time to ensure the disabled rendering effect is consistent..
- `fileList`: [UploadFile](#uploadfile)\[], List of files that have been uploaded (controlled). Here is a common issue [#2423](https://github.com/ant-design/ant-design/issues/2423) when using it.
- `headers`: object, Set request headers, valid above IE10.
- `iconRender`: (file: UploadFile, listType?: UploadListType) => ReactNode, Custom show icon.
- `isImageUrl`: (file: UploadFile) => boolean, Customize if render &lt;img /> in thumbnail. Default [(inside implementation)](https://github.com/ant-design/ant-design/blob/4ad5830eecfb87471cd8ac588c5d992862b70770/components/upload/utils.tsx#L47-L68).
- `itemRender`: (originNode: ReactElement, file: UploadFile, fileList: object\[], actions: { download: function, preview: function, remove: function }) => React.ReactNode, Custom item of uploadList. Version 4.16.0.
- `listType`: string, Built-in stylesheets, support for four types: `text`, `picture`, `picture-card` or `picture-circle`. Default `text`. Version `picture-circle`(5.2.0+).
- `maxCount`: number, Limit the number of uploaded files. Will replace current one when `maxCount` is `1`. Version 4.10.0.
- `method`: string, The http method of upload request. Default `post`.
- `multiple`: boolean, Whether to support selected multiple files. `IE10+` supported. You can select multiple files with CTRL holding down while multiple is set to be true. Default false.
- `name`: string, The name of uploading file. Default `file`.
- `openFileDialogOnClick`: boolean, Click open file dialog. Default true.
- `pastable`: boolean, Support paste file. Default false. Version 5.25.0.
- `previewFile`: (file: File | Blob) => Promise&lt;dataURL: string>, Customize preview file logic.
- `progress`: [ProgressProps](/components/progress/#api) (support `type="line"` only), Custom progress bar. Default { strokeWidth: 2, showInfo: false }. Version 4.3.0.
- `showUploadList`: boolean | { extra?: ReactNode | (file: UploadFile) => ReactNode, showPreviewIcon?: boolean | (file: UploadFile) => boolean, showDownloadIcon?: boolean | (file: UploadFile) => boolean, showRemoveIcon?: boolean | (file: UploadFile) => boolean, previewIcon?: ReactNode | (file: UploadFile) => ReactNode, removeIcon?: ReactNode | (file: UploadFile) => ReactNode, downloadIcon?: ReactNode | (file: UploadFile) => ReactNode }, Whether to show default upload list, could be an object to specify `extra`, `showPreviewIcon`, `showRemoveIcon`, `showDownloadIcon`, `removeIcon` and `downloadIcon` individually. Default true. Version `extra`: 5.20.0, `showPreviewIcon` function: 5.21.0, `showRemoveIcon` function: 5.21.0, `showDownloadIcon` function: 5.21.0.
- `styles`: Record<[SemanticDOM](#semantic-dom), CSSProperties> | (info: { props })=> Record<[SemanticDOM](#semantic-dom), CSSProperties>, Customize inline style for each semantic structure inside the component. Supports object or function.
- `withCredentials`: boolean, The ajax upload with cookie sent. Default false.
- `onChange`: function, A callback function, can be executed when uploading state is changing. It will trigger by every uploading phase. see [onChange](#onchange).
- `onDrop`: (event: React.DragEvent) => void, A callback function executed when files are dragged and dropped into the upload area. Version 4.16.0.
- `onDownload`: function(file): void, Click the method to download the file, pass the method to perform the method logic, and do not pass the default jump to the new TAB. Default (Jump to new TAB).
- `onPreview`: function(file), A callback function, will be executed when the file link or preview icon is clicked.
- `onRemove`: function(file): boolean | Promise, A callback function, will be executed when removing file button is clicked, remove event will be prevented when the return value is false or a Promise which resolve(false) or reject.

### RcFile Props

#### Required

- No required properties.

#### Optional

- `uid`: string, unique id. Will auto-generate when not provided.
- `lastModifiedDate`: date, A Date object indicating the date and time at which the file was last modified.

### UploadFile Props

#### Required

- No required properties.

#### Optional

- `crossOrigin`: `'anonymous'` | `'use-credentials'` | `''`, CORS settings attributes. Version 4.20.0.
- `name`: string, File name.
- `percent`: number, Upload progress percent.
- `status`: `error` | `done` | `uploading` | `removed`, Upload status. Show different style when configured.
- `thumbUrl`: string, Thumb image url.
- `uid`: string, unique id. Will auto-generate when not provided.
- `url`: string, Download url.

### RequestOptions Props

#### Required

- No required properties.

#### Optional

- `action`: string, Uploading URL.
- `data`: Record<string, unknown>, Uploading extra params or function which can return uploading extra params. Version 4.20.0.
- `filename`: string, file name.
- `file`: [UploadFile](#uploadfile), File object containing upload information.
- `withCredentials`: boolean, The ajax upload with cookie sent.
- `headers`: Record<string, string>, Set request headers, valid above IE10.
- `method`: string, The http method of upload request.
- `onProgress`: (event: object, file: UploadFile) => void, Progress event callback.
- `onError`: (event: object, body?: object) => void, Error callback when upload fails.
- `onSuccess`: (body: object, fileOrXhr?: UploadFile | XMLHttpRequest) => void, Success callback when upload completes.

### AcceptObject Props

#### Required

- No required properties.

#### Optional

- `format`: string, Accepted file types, same as native input accept attribute. Supports MIME types, file extensions, etc. See [input accept Attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#accept).
- `filter`: `'native'` | `(file: RcFile) => boolean`, File filtering rule. When set to `'native'`, uses browser native filtering behavior; when set to a function, allows custom filtering logic. Function returns `true` to accept the file, `false` to reject.

## Methods

No public methods.

## Common Scenario Examples

### Scenario 1: Upload by clicking

```tsx
import { UploadOutlined } from '@ant-design/icons';
import { Button, message, Upload } from 'antd';
import type { UploadProps } from 'antd';

const App: React.FC = () => {
  const props: UploadProps = {
    name: 'file', action: 'https://run.mocky.io/v3/upload', onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} uploaded successfully`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} upload failed`);
      }
    }, };

  return (
    <Upload {...props}>
      <Button icon={<UploadOutlined />}>Click to upload</Button>
    </Upload>
  );
};
```

### Scenario 2: Avatar

```tsx
import { useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Button, List, Upload } from 'antd';
import type { UploadFile, UploadProps } from 'antd';

const App: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  return (
    <>
      <Upload
        multiple
        action="https://run.mocky.io/v3/upload"
        fileList={fileList}
        onChange={handleChange}
        maxCount={5}
      >
        <Button icon={<UploadOutlined />}>Up to 5 files</Button>
      </Upload>

      <h3>Upload list</h3>
      <List
        dataSource={fileList}
        renderItem={(file) => (
          <List.Item>
            {file.name} ({file.status})
          </List.Item>
        )}
      />
    </>
  );
};
```

### Scenario 3: Default Files

```tsx
import { InboxOutlined } from '@ant-design/icons';
import { message, Upload } from 'antd';
import type { UploadProps } from 'antd';

const App: React.FC = () => {
  const props: UploadProps = {
    name: 'file', multiple: true, action: 'https://run.mocky.io/v3/upload', onChange(info) {
      const { status } = info.file;
      if (status === 'done') {
        message.success(`${info.file.name} uploaded successfully`);
      } else if (status === 'error') {
        message.error(`${info.file.name} upload failed`);
      }
    }, };

  return (
    <Upload.Dragger {...props}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">Click or drag files to this area to upload</p>
      <p className="ant-upload-hint">Batch upload supported</p>
    </Upload.Dragger>
  );
};
```

### Scenario 4: Pictures Wall

```tsx
import { useState } from 'react';
import { Image, Upload } from 'antd';
import type { UploadFile, UploadProps } from 'antd';

const App: React.FC = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj as File);
        reader.onload = () => resolve(reader.result as string);
      });
    }
  };

  return (
    <>
      <Upload
        listType="picture-card"
        fileList={fileList}
        action="https://run.mocky.io/v3/upload"
        onChange={handleChange}
        onPreview={handlePreview}
        maxCount={3}
      >
        {fileList.length < 3 && 'Text'}
      </Upload>

      <div style={{ marginTop: 16 }}>
        {fileList
          .filter((file) => file.url || file.preview)
          .map((file) => (
            <Image key={file.uid} src={file.url || file.preview} alt={file.name} width={100} />
          ))}
      </div>
    </>
  );
};
```

### Scenario 5: Pictures with picture-circle type

```tsx
import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const App: React.FC = () => {
  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Text');
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Text 5MB');
    }

    return isImage && isLt5M;
  };

  return (
    <Upload
      beforeUpload={beforeUpload}
      action="https://run.mocky.io/v3/upload"
      accept="image/*"
    >
      <Button icon={<UploadOutlined />}>Text(<5MB)</Button>
    </Upload>
  );
};
```

### Scenario 6: Complete control over file list

```tsx
import { useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Button, message, Progress, Upload } from 'antd';
import type { UploadProps } from 'antd';

const App: React.FC = () => {
  const [progress, setProgress] = useState(0);

  const customRequest: UploadProps['customRequest'] = ({
    file, onSuccess, onError, onProgress, }) => {
    const formData = new FormData();
    formData.append('file', file as any);

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      const percent = Math.round((e.loaded / e.total) * 100);
      setProgress(percent);
      onProgress?.({ percent });
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        onSuccess?.(xhr.response);
        message.success('uploaded successfully');
      } else {
        onError?.(new Error('upload failed'));
      }
    });

    xhr.open('POST', 'https://your-upload-url');
    xhr.send(formData);
  };

  return (
    <>
      <Upload customRequest={customRequest} maxCount={1}>
        <Button icon={<UploadOutlined />}>Text</Button>
      </Upload>
      {progress > 0 && <Progress percent={progress} />}
    </>
  );
};
```

## Usage Recommendations

Use Upload to used to select and upload files or drag and drop files.

## Example Code

```tsx
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, message, Upload } from 'antd';
import type { UploadProps } from 'antd';

const props: UploadProps = {
  name: 'file', action: 'https://run.mocky.io/v3/upload', headers: { authorization: 'authorization-text' }, onChange(info) {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  }, };

const App: React.FC = () => (
  <>
    <Upload {...props}>
      <Button icon={<UploadOutlined />}>Click to Upload</Button>
    </Upload>

    <Upload.Dragger {...props}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">Click or drag file to this area to upload</p>
    </Upload.Dragger>
  </>
);
```

## Result

Renders an Upload component.

## References
- Component docs: `https://ant.design/components/upload` — use for API details, defaults, and official examples.