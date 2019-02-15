#!/usr/bin/env python3
import os
import stat
import sys
import yaml
import json
import shutil
import argparse
import datetime

from jinja2 import Environment, FileSystemLoader


"""
This script generates the configuration files for the Kubernetes pods + services.
The required arguments are loaded from the config.yaml file.
"""


def create(args):
    # load configuration from config.yaml
    with open("config.yaml", "r") as fin:
        config = yaml.load(fin)
    config["now"] = datetime.datetime.utcnow()
    print("Loaded configuration:\n", json.dumps(config, indent=4, sort_keys=True, default=lambda o: "<not serializable>"))

    # generating kubernetes configuration files
    print("Generating Kubernetes configuration files...")
    if os.path.exists(args.output_dir):
        print("{} already exists. Should the configuration files be overwritten?".format(args.output_dir))
        answer = None
        while answer not in ['Y', 'y', 'N', 'n', '']:
            answer = input('Please confirm [Y/n]: ')

        if answer.lower() == 'n':
            print("Cancelled...")
            sys.exit(1)
        else:
            shutil.rmtree(args.output_dir)

    # copy the whole template directory
    shutil.copytree(args.template_dir, args.output_dir)

    # loop over all files and replace template variables
    for root, _, filenames in os.walk(args.output_dir):
        file_loader = FileSystemLoader(root)
        env = Environment(loader=file_loader)
        for filename in filenames:
            filepath = os.path.join(root, filename)
            outfile_path = os.path.join(root, filename.replace("-template", ""))

            template = env.get_template(filename)
            with open(outfile_path, "w") as fout:
                fout.write(template.render(**config))

            if ".sh" in outfile_path:
                st = os.stat(outfile_path)
                os.chmod(outfile_path, st.st_mode | stat.S_IEXEC)

            print("Generated {}.".format(outfile_path))
            os.remove(filepath) # removes the template file


def clean():
    if os.path.exists(args.output_dir):
        shutil.rmtree(args.output_dir)
        print("Removed {} folder.".format(args.output_dir))
    else:
        print("Nothing to clean.")


if __name__ == "__main__":
    argparse = argparse.ArgumentParser()
    argparse.add_argument("command", type=str, help="Options=[clean, create].")
    argparse.add_argument("--config-file", type=str, help="YAML file containing all the necessary parameters.", default="config.yaml")
    argparse.add_argument("--template-dir", type=str, help="Folder containing configuration templates (Jinja templates).", default="kubernetes-templates")
    argparse.add_argument("--output-dir", type=str, help="Output directory of generated files.", default="kubernetes")
    args = argparse.parse_args()

    if args.command == "create":
        create(args)
    elif args.command == "clean":
        clean()
    else:
        raise RuntimeError("Command '{}' is not known.".format(args.command))
