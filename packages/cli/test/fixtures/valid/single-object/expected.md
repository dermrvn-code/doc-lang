# Single Object

Object with a default value and a code sample.

## Table of Contents

- [Diagrams](#diagrams)
  - [Class Diagram](#class-diagram)
  - [Dependency Diagram](#dependency-diagram)

---

## Diagrams {#diagrams}

### Class Diagram {#class-diagram}

```mermaid
classDiagram
direction LR

class User {
  string name
  age = 30
}

```

### Dependency Diagram {#dependency-diagram}

```mermaid
graph LR

user["User"]


classDef loose fill:#ffebee,stroke:#f44336,stroke-width:4px;
class user loose;
```

---

- [Objects](#edudIlS9aWqk1BEX-objects)
   - [User](#user)

---

### Objects {#edudIlS9aWqk1BEX-objects}

#### `User` {#user}

Represents a system user.

**Fields**

- **name**: `string`
- **age**

**Usage**
```
User user = new User()
```


---

