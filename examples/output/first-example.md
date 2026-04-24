# Example Section

---

## Objects

### `Logger`

Core logging component of the system.

**Fields**

- **name**: `string`
- **id**: `int` = 0
- **log**: `Func` = [`Log`](#log)

---

### Backend

Main backend container object.

**Fields**

- **logger**: [`Logger`](#logger)

---

## Functions

### Log

Handles logging of messages.

**Parameters**
- **message**: `string`

**Return**: `void`
