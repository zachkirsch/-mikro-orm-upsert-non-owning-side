import {
  Collection,
  Entity,
  ManyToOne,
  MikroORM,
  OneToMany,
  PrimaryKey,
  ref,
} from "@mikro-orm/sqlite";

@Entity()
class Person {
  @PrimaryKey()
  id!: number;

  @OneToMany(() => Pet, (pet) => pet.owner)
  pets = new Collection<Pet>(this);
}

@Entity()
class Pet {
  @PrimaryKey()
  id!: number;

  @ManyToOne({ entity: () => Person, nullable: true })
  owner!: Person | null;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ":memory:",
    entities: [Pet, Person],
    debug: ["query", "query-params"],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test("upsert non-owning side", async () => {
  const pet = orm.em.create(Pet, {
    id: 0,
  });
  await orm.em.flush();
  orm.em.clear();

  /*
    the next line throws:

    DriverException: Cannot read properties of undefined (reading 'findIndex')

      66 |   
      67 |
    > 68 |   orm.em.upsert(Person, {
         |          ^
      69 |     id: 0,
      70 |     pets: [ref(pet.id)],
      71 |   });

      at SqliteExceptionConverter.convertException (node_modules/@mikro-orm/core/platforms/ExceptionConverter.js:8:16)
  */

  orm.em.upsert(Person, {
    id: 0,
    pets: [ref(pet.id)],
  });
});
