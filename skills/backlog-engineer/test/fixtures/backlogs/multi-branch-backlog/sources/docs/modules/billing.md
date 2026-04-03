# Billing Module

## Purpose

The billing module owns invoice creation and export workflows.

## Decisions

- Invoice export is a separate atomic task.
- Billing tasks do not depend on auth tasks.

## Derived backlog expectations

- Build billing core flow.
- Add invoice export capability.
