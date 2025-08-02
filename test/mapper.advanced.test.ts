import { describe, it } from "mocha";
import { strict as assert } from "assert";
import { Mapper } from "../src/mapper.js";
import type { Structure } from "../src/types/mapper.js";

describe("Mapper - Advanced JSONPath Queries", () => {
  // Complex test data mimicking a bookstore
  const bookstoreData = {
    store: {
      book: [
        {
          category: "reference",
          author: "Nigel Rees",
          title: "Sayings of the Century",
          price: 8.95,
          isbn: "0-553-21311-3",
        },
        {
          category: "fiction",
          author: "Evelyn Waugh",
          title: "Sword of Honour",
          price: 12.99,
          isbn: "0-679-43136-5",
        },
        {
          category: "fiction",
          author: "Herman Melville",
          title: "Moby Dick",
          price: 8.99,
          isbn: "0-553-21311-3",
        },
        {
          category: "fiction",
          author: "J. R. R. Tolkien",
          title: "The Lord of the Rings",
          price: 22.99,
          isbn: "0-395-19395-8",
        },
      ],
      bicycle: {
        color: "red",
        price: 19.95,
      },
    },
    expensive: 10,
    authors: {
      primary: {
        name: "Main Author",
        books: [
          { title: "Book 1", price: 15.99 },
          { title: "Book 2", price: 7.5 },
        ],
      },
      secondary: {
        name: "Co-Author",
        books: [{ title: "Book 3", price: 12.0 }],
      },
    },
  };

  describe("array element access patterns", () => {
    it("should map all book authors using $.store.book[*].author", () => {
      const structure: Structure = [["$.store.book[*].author", "authors"]];
      const mapper = new Mapper(structure);

      const result = mapper.map(bookstoreData);

      assert.deepEqual(result, {
        authors: [
          "Nigel Rees",
          "Evelyn Waugh",
          "Herman Melville",
          "J. R. R. Tolkien",
        ],
      });
    });

    it("should map all book titles using $.store.book[*].title", () => {
      const structure: Structure = [
        ["$.store.book[*].title", "titles"],
        ["$.store.book[*].price", "prices"],
      ];
      const mapper = new Mapper(structure);

      const result = mapper.map(bookstoreData);

      assert.deepEqual(result, {
        titles: [
          "Sayings of the Century",
          "Sword of Honour",
          "Moby Dick",
          "The Lord of the Rings",
        ],
        prices: [8.95, 12.99, 8.99, 22.99],
      });
    });

    it("should map specific array elements using indices", () => {
      const structure: Structure = [
        ["$.store.book[0].author", "firstAuthor"],
        ["$.store.book[1].title", "secondTitle"],
        ["$.store.book[3].price", "lastPrice"], // Fourth element (last in array)
      ];
      const mapper = new Mapper(structure);

      const result = mapper.map(bookstoreData);

      assert.deepEqual(result, {
        firstAuthor: "Nigel Rees",
        secondTitle: "Sword of Honour",
        lastPrice: 22.99,
      });
    });
  });

  describe("recursive descent patterns", () => {
    it("should find all authors using $..author", () => {
      const structure: Structure = [["$..author", "allAuthors"]];
      const mapper = new Mapper(structure);

      const result = mapper.map(bookstoreData);

      assert.deepEqual(result, {
        allAuthors: [
          "Nigel Rees",
          "Evelyn Waugh",
          "Herman Melville",
          "J. R. R. Tolkien",
        ],
      });
    });

    it("should find all prices using $.store..price", () => {
      const structure: Structure = [["$.store..price", "allPrices"]];
      const mapper = new Mapper(structure);

      const result = mapper.map(bookstoreData);

      assert.deepEqual(result, {
        allPrices: [8.95, 12.99, 8.99, 22.99, 19.95],
      });
    });

    it("should find all titles recursively using $..title", () => {
      const structure: Structure = [["$..title", "allTitles"]];
      const mapper = new Mapper(structure);

      const result = mapper.map(bookstoreData);

      assert.deepEqual(result, {
        allTitles: [
          "Sayings of the Century",
          "Sword of Honour",
          "Moby Dick",
          "The Lord of the Rings",
          "Book 1",
          "Book 2",
          "Book 3",
        ],
      });
    });
  });

  describe("array slicing patterns", () => {
    it("should map first two books using $..book[:2]", () => {
      const structure: Structure = [["$.store.book[:2]", "firstTwoBooks"]];
      const mapper = new Mapper(structure);

      const result = mapper.map(bookstoreData);

      assert.equal(result.firstTwoBooks.length, 2);
      assert.equal(result.firstTwoBooks[0].author, "Nigel Rees");
      assert.equal(result.firstTwoBooks[1].author, "Evelyn Waugh");
    });

    it("should map last two books using $.store.book[-2:]", () => {
      const structure: Structure = [["$.store.book[-2:]", "lastTwoBooks"]];
      const mapper = new Mapper(structure);

      const result = mapper.map(bookstoreData);

      assert.equal(result.lastTwoBooks.length, 2);
      assert.equal(result.lastTwoBooks[0].author, "Herman Melville");
      assert.equal(result.lastTwoBooks[1].author, "J. R. R. Tolkien");
    });

    it("should map middle books using slice notation", () => {
      const structure: Structure = [["$.store.book[1:3]", "middleBooks"]];
      const mapper = new Mapper(structure);

      const result = mapper.map(bookstoreData);

      assert.equal(result.middleBooks.length, 2);
      assert.equal(result.middleBooks[0].author, "Evelyn Waugh");
      assert.equal(result.middleBooks[1].author, "Herman Melville");
    });
  });

  describe("filter expressions", () => {
    it("should map books with price less than 10 using $..book[?(@.price<10)]", () => {
      const structure: Structure = [
        ["$.store.book[?(@.price<10)]", "cheapBooks"],
      ];
      const mapper = new Mapper(structure);

      const result = mapper.map(bookstoreData);

      assert.equal(result.cheapBooks.length, 2);
      assert.equal(result.cheapBooks[0].title, "Sayings of the Century");
      assert.equal(result.cheapBooks[1].title, "Moby Dick");
    });

    it("should map fiction books using $..book[?(@.category=='fiction')]", () => {
      const structure: Structure = [
        ["$.store.book[?(@.category=='fiction')]", "fictionBooks"],
      ];
      const mapper = new Mapper(structure);

      const result = mapper.map(bookstoreData);

      assert.equal(result.fictionBooks.length, 3);
      assert.equal(result.fictionBooks[0].author, "Evelyn Waugh");
      assert.equal(result.fictionBooks[1].author, "Herman Melville");
      assert.equal(result.fictionBooks[2].author, "J. R. R. Tolkien");
    });

    it("should map books with ISBN using $..book[?(@.isbn)]", () => {
      const structure: Structure = [
        ["$.store.book[?(@.isbn)]", "booksWithISBN"],
      ];
      const mapper = new Mapper(structure);

      const result = mapper.map(bookstoreData);

      assert.equal(result.booksWithISBN.length, 4);
    });
  });

  describe("complex combined patterns", () => {
    it("should combine multiple advanced patterns", () => {
      const structure: Structure = [
        ["$.store.book[*].author", "bookAuthors"],
        ["$..price", "allPrices"],
        ["$.store.book[:2].title", "firstTwoTitles"],
        ["$.store.book[?(@.price<15)].category", "cheapBookCategories"],
      ];
      const mapper = new Mapper(structure);

      const result = mapper.map(bookstoreData);

      assert.deepEqual(result.bookAuthors, [
        "Nigel Rees",
        "Evelyn Waugh",
        "Herman Melville",
        "J. R. R. Tolkien",
      ]);
      assert.deepEqual(
        result.allPrices,
        [8.95, 12.99, 8.99, 22.99, 19.95, 15.99, 7.5, 12.0],
      );
      assert.deepEqual(result.firstTwoTitles, [
        "Sayings of the Century",
        "Sword of Honour",
      ]);
      assert.deepEqual(result.cheapBookCategories, [
        "reference",
        "fiction",
        "fiction",
      ]);
    });
  });

  describe("complex JSONPath result handling", () => {
    it("should handle JSONPath results that return arrays", () => {
      const structure: Structure = [
        ["$.store.book[*].price", "allPrices"],
        ["$.store.book[*].author", "allAuthors"],
        ["$.authors.primary.books[*]", "primaryBooks"],
      ];
      const mapper = new Mapper(structure);

      const result = mapper.map(bookstoreData);

      assert.deepEqual(result.allPrices, [8.95, 12.99, 8.99, 22.99]);
      assert.deepEqual(result.allAuthors, [
        "Nigel Rees",
        "Evelyn Waugh",
        "Herman Melville",
        "J. R. R. Tolkien",
      ]);
      assert.equal(result.primaryBooks.length, 2);
      assert.equal(result.primaryBooks[0].title, "Book 1");
    });

    it("should handle nested mapping with JSONPath arrays", () => {
      const structure: Structure = [
        ["$.store.book[?(@.category=='fiction')].author", "fiction.authors"],
        [
          "$.store.book[?(@.category=='reference')].author",
          "reference.authors",
        ],
        ["$.store.book[?(@.price<10)].title", "budget.titles"],
      ];
      const mapper = new Mapper(structure);

      const result = mapper.map(bookstoreData);

      assert.deepEqual(result.fiction.authors, [
        "Evelyn Waugh",
        "Herman Melville",
        "J. R. R. Tolkien",
      ]);
      assert.deepEqual(result.reference.authors, ["Nigel Rees"]);
      assert.deepEqual(result.budget.titles, [
        "Sayings of the Century",
        "Moby Dick",
      ]);
    });

    it("should map complex nested JSONPath results", () => {
      const complexData = {
        company: {
          departments: [
            {
              name: "Engineering",
              employees: [
                { name: "Alice", salary: 120000 },
                { name: "Bob", salary: 110000 },
              ],
            },
            {
              name: "Marketing",
              employees: [
                { name: "Carol", salary: 85000 },
                { name: "Dave", salary: 90000 },
              ],
            },
          ],
        },
      };

      const structure: Structure = [
        ["$.company.departments[*].name", "departmentNames"],
        ["$.company.departments[*].employees[*].name", "allEmployeeNames"],
        ["$.company.departments[0].employees[*].salary", "engineeringSalaries"],
      ];

      const mapper = new Mapper(structure);
      const result = mapper.map(complexData);

      assert.deepEqual(result.departmentNames, ["Engineering", "Marketing"]);
      assert.deepEqual(result.allEmployeeNames, [
        "Alice",
        "Bob",
        "Carol",
        "Dave",
      ]);
      assert.deepEqual(result.engineeringSalaries, [120000, 110000]);
    });
  });

  describe("edge cases and error scenarios", () => {
    it("should handle empty arrays in JSONPath results", () => {
      const emptyData = { store: { book: [] } };
      const structure: Structure = [
        ["$.store.book[*].author", "authors"],
        ["$.store.book[?(@.price<10)]", "cheapBooks"],
      ];
      const mapper = new Mapper(structure, { skipUndefined: false });

      const result = mapper.map(emptyData);

      // When JSONPath returns no results for empty arrays, it returns undefined
      // With skipUndefined: false, undefined values should be mapped
      assert.deepEqual(result, {
        authors: undefined,
        cheapBooks: undefined,
      });
    });

    it("should handle non-existent paths gracefully", () => {
      const structure: Structure = [
        ["$.nonexistent.path", "missing"],
        ["$.store.book[*].nonexistentField", "missingFields"],
      ];
      const mapper = new Mapper(structure, { skipUndefined: true });

      const result = mapper.map(bookstoreData);

      // Should not include undefined mappings when skipUndefined is true
      assert.deepEqual(result, {});
    });

    it("should handle mixed data types in array results", () => {
      const mixedData = {
        items: [
          { type: "book", price: 10.99 },
          { type: "magazine", price: 4.99 },
          { type: "newspaper", price: 1.5 },
        ],
      };

      const structure: Structure = [
        ["$.items[*].type", "itemTypes"],
        ["$.items[*].price", "itemPrices"],
        ["$.items[0]", "firstItem"],
      ];
      const mapper = new Mapper(structure);

      const result = mapper.map(mixedData);

      assert.deepEqual(result.itemTypes, ["book", "magazine", "newspaper"]);
      assert.deepEqual(result.itemPrices, [10.99, 4.99, 1.5]);
      assert.deepEqual(result.firstItem, { type: "book", price: 10.99 });
    });
  });
});
