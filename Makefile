.PHONY: install up prod down reset rebuild build logs ps clean test

install:      ## One-shot Docker installer (generates .env, builds, starts, waits health)
	@bash install.sh

test:         ## Run the backend test suite (needs: pip install -r controller/backend/requirements*.txt)
	cd controller/backend && python3 -m pytest

up:           ## Build & start the controller stack
	docker compose up -d --build

prod:         ## Start with the production overlay (restart=always + log rotation)
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

down:         ## Stop the stack
	docker compose down

reset:        ## Stop and DELETE all data (volumes)
	docker compose down -v

rebuild:      ## Rebuild images from scratch
	docker compose build --no-cache

build:        ## Build images
	docker compose build

logs:         ## Tail logs
	docker compose logs -f

ps:           ## Show running services
	docker compose ps

clean:        ## Remove dangling images/build cache
	docker image prune -f
