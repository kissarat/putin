DROP VIEW IF EXISTS url_count;
DROP TABLE IF EXISTS link;
DROP TABLE IF EXISTS url;

CREATE TABLE url (
  id      SERIAL PRIMARY KEY,
  path    VARCHAR(256) NOT NULL,
  time    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  priority SMALLINT NOT NULL DEFAULT 0,
  crawled TIMESTAMP,
  archived TIMESTAMP
);

CREATE TABLE link (
  id    BIGSERIAL PRIMARY KEY,
  refer INT REFERENCES url (id),
  path  VARCHAR(256) NOT NULL,
  time  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE VIEW url_count AS
  SELECT
    url.path,
    char_length(url.path) as len,
    url.priority,
    url.time,
    count(link.id) AS count,
    url.crawled
  FROM url
    JOIN link ON url.id = link.refer
  GROUP BY url.path, url.time, url.crawled, url.priority;

CREATE OR REPLACE FUNCTION insert_link(_path VARCHAR(256), _priority SMALLINT) RETURNS INT AS $$
DECLARE
  _id INT;
BEGIN
  SELECT id FROM url WHERE "path" ILIKE _path INTO _id;
  IF _id IS NULL THEN
    INSERT INTO url("path", priority) VALUES (_path, _priority) RETURNING id INTO _id;
  END IF;
  INSERT INTO link("path", "refer") VALUES (_path, _id);
  RETURN _id;
END $$ LANGUAGE plpgsql;
