# Realtime Subscriptions

## Subscribe to changes
```ts
const channel = supabase
  .channel("posts-changes")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "posts" },
    (payload) => {
      console.log("Change:", payload);
    }
  )
  .subscribe();

// Cleanup
supabase.removeChannel(channel);
```

## Filtered subscription
```ts
const channel = supabase
  .channel("my-posts")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "posts",
      filter: `user_id=eq.${userId}`,
    },
    handleNewPost
  )
  .subscribe();
```

## Presence
```ts
const channel = supabase.channel("online-users");

channel
  .on("presence", { event: "sync" }, () => {
    const state = channel.presenceState();
    console.log("Online:", Object.keys(state));
  })
  .subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({ user_id: userId, online_at: new Date() });
    }
  });
```
