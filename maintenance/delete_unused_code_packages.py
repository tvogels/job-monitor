#!/usr/bin/env python3

"""
This finds orphan code packages---ones which no job refers to
and deletes them to save space in MongoDB/GridFS.
"""

from jobmonitor.connections import mongo, gridfs


def main():
    n_deleted = 0

    for file in mongo.fs.files.find():
        # Find jobs that refer to this code package
        query = {"environment.clone.code_package": file["_id"]}
        n_jobs_using_this = mongo.job.count_documents(query)

        if n_jobs_using_this == 0:
            print("Deleting file {}".format(file["_id"]))
            gridfs.delete(file["_id"])
            n_deleted += 1

    print(f"{n_deleted} code packages deleted")


if __name__ == "__main__":
    main()
