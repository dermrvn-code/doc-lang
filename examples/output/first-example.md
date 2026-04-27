# Example Section {#01}

- [Objects](#01-01)
   - [Logger](#01-01-01)
   - [Backend](#01-01-02)
- [Functions](#01-02)
   - [Log](#01-02-01)

---

## Objects {#01-01}

### `Logger` {#01-01-01}

Core logging component of the system.

**Fields**

- **name**: `string`
- **id**: `int` = 0
- **Log**: `Func` = [`Log`](#01-02-01)

**Usage**
```
Logger logger = new Logger();
```

**See also**
[`Log`](#01-02-01) [`Backend`](#01-01-02) 

---

### `Backend` {#01-01-02}

Main backend container object.

**Fields**

- **logger**: [`Logger`](#01-01-01) = new Logger()

**Usage**
```
Backend backend = new Backend();
backend.logger.log("This is a log message.");
```

**See also**
[`Logger`](#01-01-01)

---

## Functions {#01-02}

### `Log` {#01-02-01}

Handles logging of messages.

**Parameters**
- **message**: `string`

**Returns**: `void`

**Usage**
```
logger.Log("This is a log message.");
```

**See also**
[`Logger`](#01-01-01)
