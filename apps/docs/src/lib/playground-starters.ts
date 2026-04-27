/**
 * @author Ryan He
 * @date 2026-04-27
 * @description 每个组件在 Playground 页面的初始代码片段。
 *              key 是组件 slug（与 navigation 对齐），value 是 Demo.tsx 文件内容。
 */

export interface PlaygroundStarter {
  /** 组件中文名 */
  zhName: string;
  /** 组件英文名 */
  enName: string;
  /** Demo.tsx 初始内容；必须默认导出一个 React 组件。 */
  code: string;
}

const buttonStarter = `import { Button, Flex } from '@timeui/react';

export default function Demo() {
  return (
    <Flex gap={12} align="center" wrap="wrap">
      <Button color="primary" variant="solid">Primary</Button>
      <Button color="secondary" variant="bordered">Secondary</Button>
      <Button color="success" variant="flat">Success</Button>
      <Button color="danger" variant="ghost">Danger</Button>
      <Button color="primary" isLoading>Loading</Button>
      <Button color="primary" isDisabled>Disabled</Button>
    </Flex>
  );
}
`;

const inputStarter = `import { Input, Stack } from '@timeui/react';
import { useState } from 'react';

export default function Demo() {
  const [v, setV] = useState('');
  return (
    <Stack spacing={12} style={{ maxWidth: 320 }}>
      <Input placeholder="请输入内容" value={v} onChange={setV} />
      <Input placeholder="禁用状态" isDisabled />
      <Input placeholder="只读" isReadOnly value="hello" />
      <Input placeholder="错误状态" isInvalid value="invalid" />
    </Stack>
  );
}
`;

const checkboxStarter = `import { Checkbox, CheckboxGroup, Stack } from '@timeui/react';
import { useState } from 'react';

export default function Demo() {
  const [v, setV] = useState<string[]>(['apple']);
  return (
    <Stack spacing={12}>
      <CheckboxGroup value={v} onChange={setV}>
        <Checkbox value="apple">Apple</Checkbox>
        <Checkbox value="banana">Banana</Checkbox>
        <Checkbox value="orange">Orange</Checkbox>
      </CheckboxGroup>
      <div>选中: {v.join(', ') || '无'}</div>
    </Stack>
  );
}
`;

const switchStarter = `import { Switch, Stack } from '@timeui/react';
import { useState } from 'react';

export default function Demo() {
  const [on, setOn] = useState(false);
  return (
    <Stack spacing={12}>
      <Switch isSelected={on} onChange={setOn}>启用通知</Switch>
      <Switch defaultSelected color="success">订阅推送</Switch>
      <Switch isDisabled>禁用</Switch>
    </Stack>
  );
}
`;

const sliderStarter = `import { Slider } from '@timeui/react';
import { useState } from 'react';

export default function Demo() {
  const [v, setV] = useState(50);
  return (
    <div style={{ width: 320 }}>
      <Slider value={v} onChange={setV} min={0} max={100} />
      <div style={{ marginTop: 8 }}>当前值: {v}</div>
    </div>
  );
}
`;

const selectStarter = `import { Select, SelectOption } from '@timeui/react';
import { useState } from 'react';

export default function Demo() {
  const [v, setV] = useState('apple');
  return (
    <Select value={v} onChange={setV} style={{ width: 240 }}>
      <SelectOption value="apple">Apple</SelectOption>
      <SelectOption value="banana">Banana</SelectOption>
      <SelectOption value="orange">Orange</SelectOption>
    </Select>
  );
}
`;

const tagStarter = `import { Tag, Flex } from '@timeui/react';

export default function Demo() {
  return (
    <Flex gap={8} wrap="wrap">
      <Tag>Default</Tag>
      <Tag color="primary">Primary</Tag>
      <Tag color="success" variant="solid">Success</Tag>
      <Tag color="warning" variant="bordered">Warning</Tag>
      <Tag color="danger" variant="flat">Danger</Tag>
    </Flex>
  );
}
`;

const badgeStarter = `import { Badge, Avatar, Flex } from '@timeui/react';

export default function Demo() {
  return (
    <Flex gap={24} align="center">
      <Badge content={5}><Avatar name="Ryan" /></Badge>
      <Badge content="99+" color="warning"><Avatar name="A" /></Badge>
      <Badge isPulse color="danger"><Avatar name="B" /></Badge>
    </Flex>
  );
}
`;

const cardStarter = `import { Card, CardHeader, CardBody, CardFooter, Button } from '@timeui/react';

export default function Demo() {
  return (
    <Card style={{ maxWidth: 360 }}>
      <CardHeader>卡片标题</CardHeader>
      <CardBody>这里是卡片正文，可以放任意内容。试试改成你想要的样子。</CardBody>
      <CardFooter>
        <Button color="primary" size="sm">行动</Button>
      </CardFooter>
    </Card>
  );
}
`;

const modalStarter = `import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '@timeui/react';
import { useState } from 'react';

export default function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>打开 Modal</Button>
      <Modal isOpen={open} onOpenChange={setOpen} size="md">
        <ModalHeader>标题</ModalHeader>
        <ModalBody>这是 Modal 的内容。</ModalBody>
        <ModalFooter>
          <Button variant="light" onClick={() => setOpen(false)}>取消</Button>
          <Button color="primary" onClick={() => setOpen(false)}>确认</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
`;

const tooltipStarter = `import { Tooltip, Button, Flex } from '@timeui/react';

export default function Demo() {
  return (
    <Flex gap={16}>
      <Tooltip content="顶部提示" placement="top"><Button>Top</Button></Tooltip>
      <Tooltip content="右侧提示" placement="right"><Button>Right</Button></Tooltip>
      <Tooltip content="底部提示" placement="bottom"><Button>Bottom</Button></Tooltip>
    </Flex>
  );
}
`;

const tabsStarter = `import { Tabs, Tab, TabPanel } from '@timeui/react';

export default function Demo() {
  return (
    <Tabs defaultSelectedKey="a">
      <Tab itemKey="a" label="选项 A" />
      <Tab itemKey="b" label="选项 B" />
      <Tab itemKey="c" label="选项 C" />
      <TabPanel itemKey="a">这是 A 的内容。</TabPanel>
      <TabPanel itemKey="b">这是 B 的内容。</TabPanel>
      <TabPanel itemKey="c">这是 C 的内容。</TabPanel>
    </Tabs>
  );
}
`;

const genericStarter = (
  zhName: string,
  importName: string,
) => `import { ${importName} } from '@timeui/react';

export default function Demo() {
  return (
    <div>
      {/* 修改下面的代码来调试 ${zhName} 的各种 props */}
      <${importName} />
    </div>
  );
}
`;

export const PLAYGROUND_STARTERS: Record<string, PlaygroundStarter> = {
  button: { zhName: '按钮', enName: 'Button', code: buttonStarter },
  input: { zhName: '输入框', enName: 'Input', code: inputStarter },
  checkbox: { zhName: '复选框', enName: 'Checkbox', code: checkboxStarter },
  switch: { zhName: '开关', enName: 'Switch', code: switchStarter },
  slider: { zhName: '滑块', enName: 'Slider', code: sliderStarter },
  select: { zhName: '选择器', enName: 'Select', code: selectStarter },
  tag: { zhName: '标签', enName: 'Tag', code: tagStarter },
  badge: { zhName: '徽标', enName: 'Badge', code: badgeStarter },
  card: { zhName: '卡片', enName: 'Card', code: cardStarter },
  modal: { zhName: '模态框', enName: 'Modal', code: modalStarter },
  tooltip: { zhName: '工具提示', enName: 'Tooltip', code: tooltipStarter },
  tabs: { zhName: '标签页', enName: 'Tabs', code: tabsStarter },
};

/** 根据 slug 取 starter；没有专门的就用泛型回退。 */
export function getStarter(slug: string): PlaygroundStarter {
  if (PLAYGROUND_STARTERS[slug]) return PLAYGROUND_STARTERS[slug];
  // 兜底：组件名首字母大写当 import 名
  const importName = slug
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  return {
    zhName: slug,
    enName: importName,
    code: genericStarter(slug, importName),
  };
}
