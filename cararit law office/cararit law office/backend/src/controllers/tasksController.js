let tasksDB = [];

// ==========================
// GET TASKS
// ==========================
exports.getTasks = (req, res) => {
  res.json(tasksDB);
};

// ==========================
// CREATE TASK
// ==========================
exports.createTask = (req, res) => {
  try {
    const {
      title,
      description,
      assignedTo,
      createdBy,
    } = req.body;

    const newTask = {
      id: Date.now().toString(),
      title,
      description,
      assignedTo,
      createdBy,
      completed: false,
      archived: false,
      createdAt: new Date().toISOString(),
    };

    tasksDB.push(newTask);

    res.status(201).json({
      message: "Task created",
      data: newTask,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to create task",
    });
  }
};

// ==========================
// UPDATE STATUS
// ==========================
exports.updateTaskStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;

    const task = tasksDB.find(
      (t) => t.id === id
    );

    if (!task) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    task.completed = completed;

    res.json({
      message: "Task updated",
      data: task,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to update task",
    });
  }
};

// ==========================
// ARCHIVE TASK
// ==========================
exports.archiveTask = (req, res) => {
  try {
    const { id } = req.params;

    const task = tasksDB.find(
      (t) => t.id === id
    );

    if (!task) {
      return res.status(404).json({
        error: "Task not found",
      });
    }

    task.archived = true;

    res.json({
      message: "Task archived",
      data: task,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Archive failed",
    });
  }
};

// ==========================
// DELETE TASK
// ==========================
exports.deleteTask = (req, res) => {
  try {
    const { id } = req.params;

    tasksDB = tasksDB.filter(
      (t) => t.id !== id
    );

    res.json({
      message: "Task deleted",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Delete failed",
    });
  }
};