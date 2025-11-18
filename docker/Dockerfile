FROM postgres:17-alpine AS builder
RUN apk add --no-cache git build-base clang llvm-dev
RUN git clone --branch v0.8.1 https://github.com/pgvector/pgvector.git /pgvector
WORKDIR /pgvector
RUN make && make install

FROM postgres:17-alpine
COPY --from=builder /usr/local/lib/postgresql/vector.so /usr/local/lib/postgresql/vector.so
COPY --from=builder /usr/local/share/postgresql/extension /usr/local/share/postgresql/extension
