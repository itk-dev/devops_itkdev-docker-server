'use strict'

import {execSync} from "child_process"
import * as envfile from "envfile"
import * as fs from "fs"
import * as yaml from "js-yaml"

/**
 * ComposerYAML interface.
 *
 * Structure of the data read from docker compose yaml files.
 */
interface ComposerYAML {
	services: {
		[index: string]: {
			image: string,
			ports: string[],
			build: string,
		}
	}
}

/**
 * Container output information definition.
 */
interface Container {
	name: string,
	source: string,
	image: string,
	version: string
	ports: string[],
}

export default class Docker {

	/**
	 * Execute docker compose command.
	 *
	 * @param debug
	 *   If true the command will be outputted but not executed.
	 * @param env
	 *   The environment file to use.
	 * @param root
	 *   The root path to execute the command in.
	 * @param compose
	 *   The composer binary.
	 * @param inputCmd
	 *   The commands to parse to docker compose.
	 */
	public exec(debug: boolean, env: string, root: string, compose: string, inputCmd: string)
	{
		let cmd = compose + ' --env-file ' + env + ' ';

		// Get yml files from .env file.
		let content = fs.readFileSync(root + '/' + env);
		let json = envfile.parse(content.toString());
		if (!json.hasOwnProperty('COMPOSE_FILES')) {
			cmd += '-f docker-compose.server.yml '
		}
		else {
			let files = json.COMPOSE_FILES.split(",");
			files.forEach(function (element: string) {
				cmd += '-f ' + element + ' ';
			});
		}

		// Add command string.
		cmd += inputCmd;

		if (debug) {
			console.log(cmd);
		}
		else {
			try {
				execSync(cmd, {encoding: 'utf8', cwd: root, stdio: 'inherit'});
			} catch (err) {
				if (err instanceof Error) {
					console.error(err.message);
				}
				return null;
			}
		}
	}

	/**
	 * Get docker image information from yaml composer files.
	 *
	 * Use the .env file detected to find composer files
	 * and parse services.
	 *
	 * @param debug
	 * @param env
	 * @param root
	 */
	public info(debug: boolean, env: string, root: string)
	{
		let files: string[] = [ 'docker-compose.server.yml' ];
		let content = fs.readFileSync(root + '/' + env);
		let json = envfile.parse(content.toString());
		if (json.hasOwnProperty('COMPOSE_FILES')) {
			files = json.COMPOSE_FILES.split(",");
		}

		if (debug) {
			console.log('Root: ', root)
			console.log('Env-file: ', env);
			console.log('Files: ', files);
		}

		let containers: Container[] = [];
		let that: Docker = this;
		files.forEach(function (element: string) {
			containers = containers.concat(that.parse(element, root));
		}, that);

		console.log(JSON.stringify(containers));
	}

	/**
	 * Parse basic information about images based on composer yaml file.
	 *
	 * @param file
	 *   Docker compose yaml file to parse
	 * @param root
	 *   The root directory where the yaml file is located.
	 *
	 * @private
	 */
	private parse(file: string, root: string): Container[]
	{
		let fileContents = fs.readFileSync(root + '/' + file, 'utf8');
		let data = yaml.load(fileContents) as ComposerYAML;
		let containers: Container[] = [];

		for (let service of Object.keys(data.services)) {
			let container: Container = {
				'name': service,
				'source': 'unknown',
				'image': 'unknown',
				'version': 'unknown',
				'ports': []
			}

			if (data.services[service].hasOwnProperty('image')) {
				let image = data.services[service].image.split(':');
				container.source = 'hub';
				container.image = image[0];
				container.version = image[1];
				container.ports = data.services[service].hasOwnProperty('ports') ? data.services[service].ports : [];

				// Only add information to output if the service has an image defined else its simple overrides.
				containers.push(container);
			}

			// Check if this is a build.
			if (data.services[service].hasOwnProperty('build')) {
				container.source = 'build';
				container.ports = data.services[service].hasOwnProperty('ports') ? data.services[service].ports : [];

				containers.push(container);
			}

		}

		return containers;
	}
}
