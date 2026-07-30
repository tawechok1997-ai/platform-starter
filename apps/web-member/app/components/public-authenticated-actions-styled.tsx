'use client';

import type { ComponentProps } from 'react';
import PublicAuthenticatedActions from './public-authenticated-actions';
import MemberMenuIncomeRuntime from './member-menu-income-runtime';
import '../member-authenticated-public-header.css';
import '../member-authenticated-public-header-runtime.css';
import '../member-authenticated-icon-assets.css';
import '../member-authenticated-profile-source.css';
import '../member-authenticated-source-header-geometry.css';
import '../member-menu-income-runtime.css';
import '../member-authenticated-menu-assets.css';

type Props = ComponentProps<typeof PublicAuthenticatedActions>;

export default function PublicAuthenticatedActionsStyled(props: Props) {
  return (
    <>
      <PublicAuthenticatedActions {...props} />
      <MemberMenuIncomeRuntime locale={props.locale} />
    </>
  );
}
