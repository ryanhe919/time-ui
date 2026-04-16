/** @jsxImportSource @emotion/react */
'use client';

import { useState } from 'react';
import { css } from '@emotion/react';
import { Input, Stack } from '@timeui/react';

/**
 * 演示 Input 的受控用法 + label/description/errorMessage 联动：
 *   - email 字段做一个很朴素的"包含 @"校验，失败时进入 isInvalid 态
 *   - password 字段默认显示 password toggle
 *   - 同时展示 startContent / endContent 的排版
 */
export function InputFormDemo() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const emailTouched = email.length > 0;
  const emailInvalid = emailTouched && !email.includes('@');

  return (
    <Stack
      spacing={16}
      css={css`
        width: min(420px, 100%);
      `}
    >
      <Input
        type="email"
        label="邮箱 / Email"
        placeholder="you@example.com"
        description="我们只用它发登录验证码。"
        value={email}
        onChange={setEmail}
        isClearable
        isRequired
        errorMessage={emailInvalid ? '请输入合法的邮箱地址' : undefined}
        startContent={<span aria-hidden>@</span>}
        fullWidth
      />
      <Input
        type="password"
        label="密码 / Password"
        placeholder="至少 8 位"
        description="包含字母和数字，别告诉任何人。"
        value={password}
        onChange={setPassword}
        isRequired
        fullWidth
      />
    </Stack>
  );
}
