# Layout & Navigation Cases

Use this file when the user asks about **page structure**, **navigation hierarchy**, or **layout constraints**.

## Case 1: Admin console with persistent navigation

**Context**: Data-heavy B2B admin, many sections, long-lived sessions.
**Decision**: Use `Layout` with `Sider` + `Menu` for primary nav, `Breadcrumb` for hierarchy, `Tabs` only for secondary views.
**Why**: Clear hierarchy and predictable navigation; tabs are not a global navigation substitute.
**Docs**:
- `https://ant.design/docs/spec/layout`
- `https://ant.design/docs/spec/navigation`
- `https://ant.design/components/layout`
- `https://ant.design/components/menu`

## Case 2: Content site with shallow navigation

**Context**: Public website with 4–6 top-level pages.
**Decision**: Use top `Menu` and simple `Layout` header + content. Avoid `Sider`.
**Why**: Shallow nav does not need persistent sidebars.
**Docs**:
- `https://ant.design/docs/spec/navigation`
- `https://ant.design/components/menu`
- `https://ant.design/components/layout`

## Case 3: Multi-step flow (wizard)

**Context**: Onboarding or checkout with fixed steps.
**Decision**: Use `Steps` for progress, keep the main layout stable, avoid tabs.
**Why**: Steps convey linear progress better than tabs.
**Docs**:
- `https://ant.design/docs/spec/navigation`
- `https://ant.design/components/steps`

## Case 4: In-page sections with long scroll

**Context**: Single page with multiple sections.
**Decision**: Use `Anchor` and keep header fixed; optionally `Affix` for section actions.
**Why**: Anchors improve in-page navigation without full routing.
**Docs**:
- `https://ant.design/components/anchor`
- `https://ant.design/components/affix`

## Case 5: Responsive admin with collapsible sidebar

**Context**: Admin UI needs to work on large and small screens.
**Decision**: Use `Layout.Sider` with `breakpoint` and `collapsedWidth=0`; switch to a Drawer for mobile if navigation must overlay.
**Why**: Preserves primary navigation while preventing content squeeze on small screens.
**Docs**:
- `https://ant.design/components/layout`
- `https://ant.design/components/drawer`

## Case 6: Two-level navigation (global + local)

**Context**: Global product sections plus deep local subsections.
**Decision**: Use Header `Menu` for global areas and `Sider`/`Menu` for local navigation; keep Breadcrumbs for location.
**Why**: Keeps global navigation visible without flattening local structure.
**Docs**:
- `https://ant.design/docs/spec/navigation`
- `https://ant.design/components/menu`
- `https://ant.design/components/breadcrumb`

## Case 7: Fixed action bar on detail pages

**Context**: Long detail page with primary actions (Save/Approve) that should stay visible.
**Decision**: Use `Affix` for an action bar, ensure it does not cover content on small viewports.
**Why**: Keeps key actions reachable without interrupting scroll.
**Docs**:
- `https://ant.design/components/affix`
