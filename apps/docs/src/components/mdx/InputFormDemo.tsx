/** @jsxImportSource @emotion/react */

/**
 * @author Ryan He
 * @date 2026-04-16
 * @description 实现文档站 MDX 示例组件 InputFormDemo。
 */

'use client';

import { useState } from 'react';
import { css } from '@emotion/react';
import { Input, Stack } from '@timeui/react';

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
        isFullWidth
      />
      <Input
        type="password"
        label="密码 / Password"
        placeholder="至少 8 位"
        description="包含字母和数字，别告诉任何人。"
        value={password}
        onChange={setPassword}
        isRequired
        isFullWidth
      />
    </Stack>
  );
}
