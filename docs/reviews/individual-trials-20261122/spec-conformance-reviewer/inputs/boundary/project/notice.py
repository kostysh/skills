def make_record(job, mass):
    return {"job": job, "mass": str(0 if mass is None else mass)}


def submit(archive, job, mass):
    record = make_record(job, mass)
    archive.save(job, record)
    return record
