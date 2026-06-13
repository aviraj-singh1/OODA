"""
Counter-Strike Routes — Phase 5: Full package generation and deployment.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database.models import get_db
from backend.database import crud
from backend.api.schemas import (
    CounterStrikePackageResponse,
    DeployCounterStrikeResponse,
)
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

    Requires signal and debate to exist.
    If no debate exists, returns 400.
    If package already exists and force=false, returns existing package.
    If force=true, regenerates package.
    """
    try:
        result = _builder.build(signal_id, db, force=force)
        return result
    except ValueError as e:
        # Signal not found
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        # Debate not found
        raise HTTPException(status_code=400, detail=str(e))
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

    signal = crud.get_signal(db, pkg.signal_id) if pkg.signal_id else None
    debate = crud.get_debate_by_signal(db, pkg.signal_id) if pkg.signal_id else None

    if signal and debate:
        return _builder._build_response_from_db(pkg, signal, debate, db)

    # Fallback: return raw package data
    return CounterStrikePackageResponse.model_validate(pkg)


@router.get("/{package_id}")
def get_package(package_id: str, db: Session = Depends(get_db)):
    """Get a specific package by ID with parsed assets."""
    pkg = crud.get_package(db, package_id)
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    signal = crud.get_signal(db, pkg.signal_id) if pkg.signal_id else None
    debate = crud.get_debate_by_signal(db, pkg.signal_id) if pkg.signal_id else None

    if signal and debate:
        return _builder._build_response_from_db(pkg, signal, debate, db)

    return CounterStrikePackageResponse.model_validate(pkg)


@router.post("/{package_id}/deploy", response_model=DeployCounterStrikeResponse)
def deploy_package(package_id: str, db: Session = Depends(get_db)):
    """
    Simulate deployment of a counter-strike package.

    Sets package status to DEPLOYED with timestamp.
    Repeated deploy calls return current deployed status without crashing.
    """
    pkg = crud.get_package(db, package_id)
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    # Handle already deployed
    if pkg.deployed == 1 or pkg.status == "DEPLOYED":
        return DeployCounterStrikeResponse(
            message=f"Counter-Strike '{pkg.title or package_id}' is already deployed.",
            deployment_mode="SIMULATED",
            actions=[
                "Retention email prepared",
                "Sales battlecard exported",
                "Social response queued",
                "Internal team alert generated",
                "Comparison report prepared",
            ],
            status="DEPLOYED",
        )

    # Deploy
    crud.deploy_package(db, package_id)

    return DeployCounterStrikeResponse(
        message="Counter-Strike deployed successfully in simulation mode.",
        deployment_mode="SIMULATED",
        actions=[
            "Retention email prepared",
            "Sales battlecard exported",
            "Social response queued",
            "Internal team alert generated",
            "Comparison report prepared",
        ],
        status="DEPLOYED",
    )
