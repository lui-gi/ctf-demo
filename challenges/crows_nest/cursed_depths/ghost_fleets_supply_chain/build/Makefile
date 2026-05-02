# Makefile for the Ghost Fleet's Supply Chain island.
# Wraps build.sh; `make all` is the canonical entry point.

.PHONY: all build up down verify clean

all: build

build:
	@./build.sh build

up:
	@./build.sh up

down:
	@./build.sh down

verify:
	@./build.sh verify

clean: down
	@docker image prune -f --filter label=island=ghost_fleets_supply_chain
