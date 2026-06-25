using System;

namespace App {
    // Simple Person class with mixed field types
    public class Person {
        public string Name { get; set; }
        public int Id { get; set; }
        public bool Active { get; set; }
        public double Balance { get; set; }
    }

    // Account links to a Person (shows inter-object link)
    public class Account {
        public Person Owner { get; set; }
        public string Number { get; set; }
        public long OpenedTicks { get; set; }
        public double Balance { get; set; }
    }

    public static class Bank {
        public static Account CreateAccount(Person owner, double initialDeposit) {
            var acc = new Account {
                Owner = owner,
                Number = Guid.NewGuid().ToString(),
                OpenedTicks = DateTime.UtcNow.Ticks,
                Balance = initialDeposit
            };
            return acc;
        }

        public static string Greet(Person p) => $"Hello, {p.Name}";
    }

    class Program {
        static void Main(string[] args) {
            var alice = new Person { Name = "Alice", Id = 1, Active = true, Balance = 100.5 };
            var account = Bank.CreateAccount(alice, 250.0);
            Console.WriteLine(Bank.Greet(alice));
            Console.WriteLine($"Account {account.Number} balance: {account.Balance}");
        }
    }
}
