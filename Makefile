.PHONY: start-services
start-services: build
	./dc.sh up -d

.PHONY: stop-services
stop-services:
	./dc.sh stop

.PHONY: clean
clean:
	./dc.sh rm -f
	rm -rf ./docker/.qtum

.PHONY: build
build:
	./dc.sh build

.PHONY: prefund
prefund:
	./dc.sh exec insightapi qcli generate 700
	# contract deployer account
	./dc.sh exec insightapi qcli importprivkey "cVLiw3xKLNVMVKkhNhQGxHc6VmAgdu7jeyt2KYND2BCbwnHqiPBw"
	./dc.sh exec insightapi solar prefund qWwbyHadbwKtCTZtTBjwRmv1hW27Bi11bc 1000
	# two tests account
	./dc.sh exec insightapi solar prefund qUbxboqjBRp96j3La8D1RYkyqx5uQbJPoW 1000000
	./dc.sh exec insightapi solar prefund qLn9vqbr2Gx3TsVR9QyTVB5mrMoh4x43Uf 1000000


.PHONY: migrate
migrate:
	truffle migrate --reset --network=qtum
