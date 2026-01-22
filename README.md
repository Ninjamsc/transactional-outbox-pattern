TopicStarter: high concurrency system
Problem: How to atomically update the database and send messages to a message broker?
Implementation: Transactional outbox pattern

Context:
A service command typically needs to create/update/delete aggregates in the database and send messages/events to a message broker. 
For example, a service that participates in a saga needs to update business entities and send messages/events. Similarly, a service that publishes a domain event must update an aggregate and publish an event.

The command must atomically update the database and send messages in order to avoid data inconsistencies and bugs. 
However, it is not viable to use a traditional distributed transaction (2PC) that spans the database and the message broker The database and/or the message broker might not support 2PC. <img width="1298" height="461" alt="ReliablePublication" src="https://github.com/user-attachments/assets/b5caed8a-23b7-44dc-a4f2-2e4d58152a8b" />

And even if they do, it’s often undesirable to couple the service to both the database and the message broker.

But without using 2PC, sending a message in the middle of a transaction is not reliable. 
There’s no guarantee that the transaction will commit. Similarly, if a service sends a message after committing the transaction there’s no guarantee that it won’t crash before sending the message.

In addition, messages must be sent to the message broker in the order they were sent by the service. 
They must usually be delivered to each consumer in the same order although that’s outside the scope of this pattern. For example, let’s suppose that an aggregate is updated by a series of transactions T1, T2, etc. 
This transactions might be performed by the same service instance or by different service instances. Each transaction publishes a corresponding event: T1 -> E1, T2 -> E2, etc. Since T1 precedes T2, event E1 must be published before E2.


2PC is not an option. The database and/or the message broker might not support 2PC. Also, it’s often undesirable to couple the service to both the database and the message broker.
If the database transaction commits then the messages must be sent. Conversely, if the database rolls back, the messages must not be sent
Messages must be sent to the message broker in the order they were sent by the service. This ordering must be preserved across multiple service instances that update the same aggregate.

Design:
The solution is for the service that sends the message to first store the message in the database as part of the transaction that updates the business entities. A separate process then sends the messages to the message broker.
(Diagramm )

The participants in this pattern are:

Sender - the service that sends the message
Database - the database that stores the business entities and message outbox
Message outbox - if it’s a relational database, this is a table that stores the messages to be sent. Otherwise, if it’s a NoSQL database, the outbox is a property of each database record (e.g. document or item)
Message relay - sends the messages stored in the outbox to the message broker
Result context §
This pattern has the following benefits:

Result context:

2PC is not used
Messages are guaranteed to be sent if and only if the database transaction commits
Messages are sent to the message broker in the order they were sent by the application
This pattern has the following drawbacks:

Potentially error prone since the developer might forget to publish the message/event after updating the database.
This pattern also has the following issues:

The Message relay might publish a message more than once. It might, for example, crash after publishing a message but before recording the fact that it has done so. 
When it restarts, it will then publish the message again. As a result, a message consumer must be idempotent, perhaps by tracking the IDs of the messages that it has already processed. 
Fortunately, since message Consumers usually need to be idempotent (because a message broker can deliver messages more than once) this is typically not a problem.
