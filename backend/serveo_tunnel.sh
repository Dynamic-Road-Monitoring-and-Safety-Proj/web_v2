#!/bin/bash
ssh -o StrictHostKeyChecking=no -R 80:localhost:8001 serveo.net
