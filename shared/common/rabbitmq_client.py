"""
RabbitMQ client for message queue and async task processing
"""
import json
import logging
from typing import Any, Callable, Dict, Optional
import aio_pika
from aio_pika import Message, ExchangeType, DeliveryMode
from aio_pika.abc import AbstractRobustConnection, AbstractRobustChannel

logger = logging.getLogger(__name__)


class RabbitMQClient:
    """Async RabbitMQ client wrapper"""
    
    def __init__(self, rabbitmq_url: str):
        self.rabbitmq_url = rabbitmq_url
        self.connection: Optional[AbstractRobustConnection] = None
        self.channel: Optional[AbstractRobustChannel] = None
        self.exchanges: Dict[str, Any] = {}
        self.queues: Dict[str, Any] = {}
    
    async def connect(self):
        """Establish connection to RabbitMQ"""
        try:
            self.connection = await aio_pika.connect_robust(
                self.rabbitmq_url,
                reconnect_interval=5
            )
            self.channel = await self.connection.channel()
            await self.channel.set_qos(prefetch_count=10)
            logger.info("RabbitMQ connection established")
        except Exception as e:
            logger.error(f"RabbitMQ connection error: {e}")
            raise
    
    async def declare_exchange(
        self,
        exchange_name: str,
        exchange_type: str = "topic",
        durable: bool = True
    ):
        """Declare an exchange"""
        if exchange_name in self.exchanges:
            return self.exchanges[exchange_name]
        
        try:
            exchange = await self.channel.declare_exchange(
                exchange_name,
                type=getattr(ExchangeType, exchange_type.upper()),
                durable=durable
            )
            self.exchanges[exchange_name] = exchange
            logger.info(f"Exchange declared: {exchange_name}")
            return exchange
        except Exception as e:
            logger.error(f"Exchange declaration error: {e}")
            raise
    
    async def declare_queue(
        self,
        queue_name: str,
        durable: bool = True,
        auto_delete: bool = False,
        arguments: Optional[Dict] = None
    ):
        """Declare a queue"""
        if queue_name in self.queues:
            return self.queues[queue_name]
        
        try:
            queue = await self.channel.declare_queue(
                queue_name,
                durable=durable,
                auto_delete=auto_delete,
                arguments=arguments or {}
            )
            self.queues[queue_name] = queue
            logger.info(f"Queue declared: {queue_name}")
            return queue
        except Exception as e:
            logger.error(f"Queue declaration error: {e}")
            raise
    
    async def bind_queue(
        self,
        queue_name: str,
        exchange_name: str,
        routing_key: str
    ):
        """Bind queue to exchange with routing key"""
        try:
            queue = self.queues.get(queue_name)
            exchange = self.exchanges.get(exchange_name)
            
            if not queue or not exchange:
                raise ValueError("Queue or Exchange not declared")
            
            await queue.bind(exchange, routing_key=routing_key)
            logger.info(f"Queue {queue_name} bound to {exchange_name} with key {routing_key}")
        except Exception as e:
            logger.error(f"Queue binding error: {e}")
            raise
    
    async def publish(
        self,
        exchange_name: str,
        routing_key: str,
        message: Any,
        persistent: bool = True
    ):
        """Publish message to exchange"""
        try:
            exchange = self.exchanges.get(exchange_name)
            if not exchange:
                raise ValueError(f"Exchange {exchange_name} not declared")
            
            # Convert message to JSON
            if isinstance(message, (dict, list)):
                body = json.dumps(message).encode()
            else:
                body = str(message).encode()
            
            # Create message
            msg = Message(
                body=body,
                delivery_mode=DeliveryMode.PERSISTENT if persistent else DeliveryMode.NOT_PERSISTENT,
                content_type="application/json"
            )
            
            # Publish
            await exchange.publish(msg, routing_key=routing_key)
            logger.debug(f"Published message to {exchange_name}/{routing_key}")
            
        except Exception as e:
            logger.error(f"Publish error: {e}")
            raise
    
    async def consume(
        self,
        queue_name: str,
        callback: Callable,
        auto_ack: bool = False
    ):
        """Consume messages from queue"""
        try:
            queue = self.queues.get(queue_name)
            if not queue:
                raise ValueError(f"Queue {queue_name} not declared")
            
            async def process_message(message: aio_pika.IncomingMessage):
                async with message.process(ignore_processed=auto_ack):
                    try:
                        # Decode message
                        body = json.loads(message.body.decode())
                        
                        # Call callback
                        await callback(body)
                        
                        # Acknowledge if not auto_ack
                        if not auto_ack:
                            await message.ack()
                            
                    except Exception as e:
                        logger.error(f"Message processing error: {e}")
                        if not auto_ack:
                            await message.reject(requeue=True)
            
            await queue.consume(process_message)
            logger.info(f"Started consuming from queue: {queue_name}")
            
        except Exception as e:
            logger.error(f"Consume error: {e}")
            raise
    
    async def close(self):
        """Close RabbitMQ connection"""
        if self.connection:
            await self.connection.close()
            logger.info("RabbitMQ connection closed")


# Global instance
rabbitmq_client: RabbitMQClient = None


async def init_rabbitmq(rabbitmq_url: str):
    """Initialize RabbitMQ client"""
    global rabbitmq_client
    rabbitmq_client = RabbitMQClient(rabbitmq_url)
    await rabbitmq_client.connect()
    logger.info("RabbitMQ client initialized")


def get_rabbitmq() -> RabbitMQClient:
    """Dependency for getting RabbitMQ client"""
    return rabbitmq_client


# Common exchange and queue names
class Exchanges:
    """Exchange names"""
    ANNOTATION = "annotation.exchange"
    EVALUATION = "evaluation.exchange"
    NOTIFICATION = "notification.exchange"
    AI_INFERENCE = "ai.inference.exchange"
    DICOM = "dicom.exchange"


class RoutingKeys:
    """Routing keys"""
    # Annotation
    ANNOTATION_CREATED = "annotation.created"
    ANNOTATION_UPDATED = "annotation.updated"
    ANNOTATION_COMPLETED = "annotation.completed"
    
    # Evaluation
    EVALUATION_REQUEST = "evaluation.request"
    EVALUATION_COMPLETED = "evaluation.completed"
    
    # Notification
    NOTIFICATION_EMAIL = "notification.email"
    NOTIFICATION_PUSH = "notification.push"
    
    # AI Inference
    AI_SEGMENT_REQUEST = "ai.segment.request"
    AI_SEGMENT_COMPLETED = "ai.segment.completed"
    
    # DICOM
    DICOM_UPLOADED = "dicom.uploaded"
    DICOM_PROCESSED = "dicom.processed"


class Queues:
    """Queue names"""
    ANNOTATION_TASKS = "annotation.tasks"
    EVALUATION_TASKS = "evaluation.tasks"
    NOTIFICATION_TASKS = "notification.tasks"
    AI_INFERENCE_TASKS = "ai.inference.tasks"
    DICOM_PROCESSING = "dicom.processing"
