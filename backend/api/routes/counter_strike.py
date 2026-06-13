"""
Counter-Strike Routes — Phase 5: Full package generation and deployment.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database.models import get_db
from backend.database import crud
from backend.api.schemas import CounterStrikePackageResponse, APIMessageResponse
from backend.counter_strike.package_builder import PackageBuilder

router = APIRouter(prefix="/api/counter-strike", tags=["Counter-Strike"])

# Pre-instantiate builder (stateless)
_builder = PackageBuilder()


@router.post("/build/{signal_id}")
def build_package(
    signal_id: str,
    force: bool = Query(default=False, description="Force rebuild even if package exists"),
    db: Session = Depends(get_db),
):
    """
    Build a complete Counter-Strike package for a signal.

    Pipeline:
        1. Ensures debate exists (runs if needed)
        2. Generates 5 assets: email, battlecard, social, alert, comparison
        3. Saves package to database
        4. Returns full package with all assets

    Use ?force=true to regenerate an existing package.
    """
    try:
        result = _builder.build(signal_id, db, force=force)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Counter-Strike build error: {str(e)}",
        )


@router.get("/latest")
def get_latest_package(db: Session = Depends(get_db)):
    """Get the most recent counter-strike package with parsed assets."""
    pkg = crud.get_latest_package(db)
    if not pkg:
        raise HTTPException(status_code=404, detail="No packages found")

    # Also get signal info
    signal = crud.get_signal(db, pkg.signal_id) if pkg.signal_id else None

    return _builder._build_response_from_db(pkg, signal, db) if signal else {
        "package": {
            "id": pkg.id,
            "signal_id": pkg.signal_id,
            "debate_id": pkg.debate_id,
            "title": pkg.title,
            "status": pkg.status,
            "deployed": pkg.deployed,
            "created_at": pkg.created_at,
        },
        "assets": {},
        "deploy_mode": "SIMULATED",
    }


@router.get("/{package_id}")
def get_package(package_id: str, db: Session = Depends(get_db)):
    """Get a specific package by ID with parsed assets."""
    pkg = crud.get_package(db, package_id)
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    signal = crud.get_signal(db, pkg.signal_id) if pkg.signal_id else None
    if signal:
        return _builder._build_response_from_db(pkg, signal, db)

    return CounterStrikePackageResponse.model_validate(pkg)


@router.post("/{package_id}/deploy", response_model=APIMessageResponse)
def deploy_package(package_id: str, db: Session = Depends(get_db)):
    """
    Simulate deployment of a counter-strike package.

    Sets package status to DEPLOYED and returns success message
    with the list of simulated actions taken.
    """
    pkg = crud.deploy_package(db, package_id)
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    return APIMessageResponse(
        status="deployed",
        message=(
            f"Counter-Strike '{pkg.title or package_id}' deployed successfully (simulated). "
            f"Actions: Retention email prepared · Sales battlecard exported · "
            f"Internal alert generated · Social response queued."
        ),
    )
