# federated-stitched-subscriptions-example

Adds subscription services as stitched services alongside a Federated Graph, as a go-between until Federation supports subscriptions.

Supports `subscriptions-transport-ws`. `graphql-ws` is also possible, but it is not natively compatible with Apollo Client/Server
(i.e. all subscription services and clients would have to use the package for it to work). Alternatively, the stitching gateway can
support differing protocols for upstream services and clients.

```
-----------------------[apollo client]------------------------
------------------------------|-------------------------------
----[••••••••••schema stitching gateway gateway••••••••••]----
-------|----------------------------|---------------|---------
----[federation gateway]------[dateTimeSvc]----[uptimeSvc]----
-------|---------|--------------------------------------------
----[fleet]----[employee]-------------------------------------
```

- `vehicle`/`employee` are regular Federated services, aggregated by the Apollo Federation Gateway
- `datetime`/`uptime` are two subscription-only services (though they can also support queries/mutations like regular stitched services - it would complicate things, however). They emit the time / server uptime respectively every second.

## Running

1. Start

    ```sh
    # In one terminal
    yarn start:services
    # In another
    yarn start:gateway
    ```

2. The gateway playground can be accessed at <http://localhost:3000/playground>

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

- [ ] Authentication
- [x] Automatic schema loading for federated services. Since the service now sits in front of the regular Apollo Gateway, it needs to update. It also uses the Apollo Studio managed schema updates, and hot-swaps the stitched server with new updates.
- [ ] Reloading/Managed Graph for schema changes in stitched subscription services. Introspection is not suitable for production.
- [ ] Client introspection - clients currently use the Apollo CLI, they shouldn't need to introspect from the stitched gateway to make this work.
- [ ] Check about how open connections are handled when the schema is updated.
- [ ] Schema validation - the stitched services should not conflict with the Federated graph or each other.
