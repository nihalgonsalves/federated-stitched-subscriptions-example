# federated-stitched-subscriptions-example

Adds subscription services as stitched services alongside a Federated Graph, as a go-between until Federation supports subscriptions.

Supports `subscriptions-transport-ws`. `graphql-ws` is also possible, but it is not natively compatible with Apollo Client/Server
(i.e. all subscription services and clients would have to use the package for it to work). Alternatively, the stitching gateway can
support differing protocols for upstream services and clients.

```
------[******* apollo client ******* ]------------------------
-------|----------------------------|-------------------------
-------|-----------------------[schema stitching gateway]-----
-------|----------------------------|---------------|---------
----[federation gateway]------[dateTimeSvc]----[uptimeSvc]----
-------|---------|--------------------------------------------
----[fleet]----[employee]-------------------------------------
```

- `vehicle`/`employee` are regular Federated services, aggregated by the Apollo Federation Gateway
- `datetime`/`uptime` are two subscription-only services. They emit the time / server uptime respectively every second.
- For simplicity, only subscriptions can be used via the subscription services. It is also possible to make the stitching gateway
  sit in front of the federation gateway as well (simply by adding another subschema config - can be loaded directly by creating a new gateway instance and awaiting `.load()` and defining `onSchemaChange`), but this adds another bottleneck and increases complexity.

## Running

1. Start

   ```sh
   # In one terminal
   yarn start:services
   # In another
   yarn start:gateway
   # In another
   yarn start:client
   ```

2. The federation gateway playground can be accessed at <http://localhost:4000/>

3. The subscription gateway playground can be accessed at <http://localhost:3000/>

4. The client example can be accessed at <http://localhost:5000/>

## Sample queries

1. Federated query

   ```graphql
   {
     vehicles {
       id
       currentlyOpenedBy {
         id
       }
     }
   }
   ```

2. Subscription query (a)

   ```graphql
   subscription {
     uptimeSeconds
   }
   ```

3. Subscription query (b)

   ```graphql
   subscription {
     dateTime
   }
   ```

## TODO

- [x] Authentication - headers & connection params are passed through
- [ ] Reloading/Managed Graph for subscription services. Introspection is not suitable for production.
- [ ] Client introspection - clients currently use the Apollo CLI for the federated schema, how do they get the subscription schema without introspection?
- [ ] Check about how open connections are handled when the schema is updated.
- [ ] Schema validation - the stitched services should not conflict with the Federated graph or each other.
- [ ] Test error handling
