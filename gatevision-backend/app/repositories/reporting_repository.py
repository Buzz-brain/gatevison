from datetime import datetime, timezone
from typing import Optional

from app.models.decision_record import DecisionRecord
from app.models.gate_transaction import GateTransaction
from app.models.system_event import SystemEvent


class ReportingRepository:
    @staticmethod
    async def get_transactions_in_range(
        start: datetime, end: datetime,
        action: Optional[str] = None,
        skip: int = 0, limit: int = 100,
    ) -> list[GateTransaction]:
        query = {
            "timestamp": {"$gte": start, "$lte": end},
        }
        if action:
            query["action"] = action
        return (
            await GateTransaction.find(query)
            .sort(-GateTransaction.timestamp)
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    @staticmethod
    async def count_transactions_in_range(
        start: datetime, end: datetime,
        action: Optional[str] = None,
    ) -> int:
        query = {
            "timestamp": {"$gte": start, "$lte": end},
        }
        if action:
            query["action"] = action
        return await GateTransaction.find(query).count()

    @staticmethod
    async def get_decisions_in_range(
        start: datetime, end: datetime,
        decision: Optional[str] = None,
        skip: int = 0, limit: int = 100,
    ) -> list[DecisionRecord]:
        query = {
            "created_at": {"$gte": start, "$lte": end},
        }
        if decision:
            query["decision"] = decision
        return (
            await DecisionRecord.find(query)
            .sort(-DecisionRecord.created_at)
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    @staticmethod
    async def count_decisions_in_range(
        start: datetime, end: datetime,
        decision: Optional[str] = None,
    ) -> int:
        query = {
            "created_at": {"$gte": start, "$lte": end},
        }
        if decision:
            query["decision"] = decision
        return await DecisionRecord.find(query).count()

    @staticmethod
    async def get_events_in_range(
        start: datetime, end: datetime,
        event_type: Optional[str] = None,
        severity: Optional[str] = None,
        skip: int = 0, limit: int = 100,
    ) -> list[SystemEvent]:
        query = {
            "created_at": {"$gte": start, "$lte": end},
        }
        if event_type:
            query["event_type"] = event_type
        if severity:
            query["severity"] = severity
        return (
            await SystemEvent.find(query)
            .sort(-SystemEvent.created_at)
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    @staticmethod
    async def get_hourly_distribution(
        start: datetime, end: datetime,
    ) -> list[dict]:
        pipeline = [
            {"$match": {"timestamp": {"$gte": start, "$lte": end}}},
            {
                "$group": {
                    "_id": {"$hour": "$timestamp"},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        return await GateTransaction.aggregate(pipeline).to_list()

    @staticmethod
    async def get_daily_trend(
        start: datetime, end: datetime,
    ) -> list[dict]:
        pipeline = [
            {"$match": {"timestamp": {"$gte": start, "$lte": end}}},
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$timestamp",
                        }
                    },
                    "count": {"$sum": 1},
                    "entries": {
                        "$sum": {
                            "$cond": [
                                {"$eq": ["$action", "ENTRY"]}, 1, 0,
                            ]
                        }
                    },
                    "exits": {
                        "$sum": {
                            "$cond": [
                                {"$eq": ["$action", "EXIT"]}, 1, 0,
                            ]
                        }
                    },
                }
            },
            {"$sort": {"_id": 1}},
        ]
        return await GateTransaction.aggregate(pipeline).to_list()

    @staticmethod
    async def get_most_active_vehicles(
        start: datetime, end: datetime, limit: int = 10,
    ) -> list[dict]:
        pipeline = [
            {"$match": {"timestamp": {"$gte": start, "$lte": end}}},
            {"$group": {"_id": "$vehicle_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": limit},
        ]
        return await GateTransaction.aggregate(pipeline).to_list()

    @staticmethod
    async def get_processing_time_stats(
        start: datetime, end: datetime,
    ) -> dict:
        pipeline = [
            {"$match": {"created_at": {"$gte": start, "$lte": end}}},
            {
                "$group": {
                    "_id": None,
                    "avg_processing_time": {"$avg": "$processing_time"},
                    "max_processing_time": {"$max": "$processing_time"},
                    "count": {"$sum": 1},
                }
            },
        ]
        results = await DecisionRecord.aggregate(pipeline).to_list()
        if results:
            r = results[0]
            return {
                "avg_processing_time_ms": round(r.get("avg_processing_time", 0), 2),
                "max_processing_time_ms": round(r.get("max_processing_time", 0), 2),
                "total_decisions": r.get("count", 0),
            }
        return {
            "avg_processing_time_ms": 0.0,
            "max_processing_time_ms": 0.0,
            "total_decisions": 0,
        }
