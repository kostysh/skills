Delivery planning bridges accepted product/architecture context and executable implementation work.

The main purpose is architecture-to-task decomposition: take accepted architecture handoff items, constraints, boundaries, contracts, risks, and validation obligations, then produce right-sized tasks that downstream agents can safely execute.

The skill supports multiple planning scopes:

- whole project;
- feature or epic;
- module, service, bounded context, package, adapter, or subsystem;
- integration or provider flow;
- one architecture handoff item;
- backlog audit or repair.

Default output is one compact Markdown Delivery Plan. Heavy YAML registers are not the default path.

Treat the workflow as a small set of planning decisions, not a form the agent must fill in mechanically. A useful plan may be short when scope is narrow and authority is already clear.

The skill does not produce PRDs, architecture decisions, ADRs, ASR records, implementation-ready specs, code, CI changes, or merge decisions.
