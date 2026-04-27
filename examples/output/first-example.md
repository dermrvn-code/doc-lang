# Example Section

---

## Objects

### `Logger`

Core logging component of the system.

**Fields**

- **name**: `string`
- **id**: `int` = 0
- **log**: `Func` = [`Log`](#log)

**Usage**
```
Logger logger = new Logger();
```

---

### `Backend`

Main backend container object.

**Fields**

- **logger**: [`Logger`](#logger)

**Usage**
```
Backend backend = new Backend();
backend.logger.log("This is a log message.");
```
---

## Functions

### `Log`

Handles logging of messages.

**Parameters**
- **message**: `string`

**Returns**: `void`

**Usage**
```
logger.Log("This is a log message.");
```
