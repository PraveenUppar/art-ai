from enum import Enum

from .domain import *
from .fact_check import *
from .link_checker import *


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"



